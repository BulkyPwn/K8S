package handler

import (
"io"
"net/http"
"sync"

"github.com/gin-gonic/gin"
"github.com/gorilla/websocket"
corev1 "k8s.io/api/core/v1"
"k8s.io/client-go/kubernetes/scheme"
"k8s.io/client-go/tools/remotecommand"
)

type ExecHandler struct{}

var upgrader = websocket.Upgrader{
CheckOrigin: func(r *http.Request) bool { return true },
}

// Exec WebSocket 终端 exec into pod
func (h *ExecHandler) Exec(c *gin.Context) {
cs, err := getActive()
if err != nil {
// 此时还没有升级 WS，可以安全返回 JSON
c.JSON(http.StatusBadRequest, gin.H{"code": 500, "message": err.Error()})
return
}
ns := c.Param("namespace")
name := c.Param("name")
container := c.Query("container")
cmd := c.QueryArray("command")
if len(cmd) == 0 {
cmd = []string{"/bin/sh"}
}

conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
if err != nil {
// upgrader 内部已写错误响应，不再重复写
return
}
defer conn.Close()

req := cs.Kubernetes.CoreV1().RESTClient().Post().
Resource("pods").
Name(name).
Namespace(ns).
SubResource("exec").
VersionedParams(&corev1.PodExecOptions{
Container: container,
Command:   cmd,
Stdin:     true,
Stdout:    true,
Stderr:    true,
TTY:       true,
}, scheme.ParameterCodec)

executor, err := remotecommand.NewSPDYExecutor(cs.RestConfig, "POST", req.URL())
if err != nil {
conn.WriteMessage(websocket.TextMessage, []byte("创建 executor 失败: "+err.Error()))
return
}

term := &wsTerminal{conn: conn}
opts := remotecommand.StreamOptions{
Stdin:             term,
Stdout:            term,
Stderr:            term,
Tty:               true,
TerminalSizeQueue: term,
}

if err := executor.StreamWithContext(c.Request.Context(), opts); err != nil {
conn.WriteMessage(websocket.TextMessage, []byte("\r\n** 连接关闭: "+err.Error()+" **\r\n"))
}
}

// wsTerminal 实现 io.Reader/Writer 和 TerminalSizeQueue
type wsTerminal struct {
conn          *websocket.Conn
mu            sync.Mutex
width, height uint16
resizeCh      chan remotecommand.TerminalSize
startOnce     sync.Once
}

func (t *wsTerminal) init() {
t.resizeCh = make(chan remotecommand.TerminalSize, 4)
}

func (t *wsTerminal) Read(p []byte) (int, error) {
t.startOnce.Do(t.init)
for {
_, data, err := t.conn.ReadMessage()
if err != nil {
return 0, err
}
if len(data) == 0 {
continue
}
switch data[0] {
case 1: // resize
if len(data) >= 5 {
w := uint16(data[1])<<8 | uint16(data[2])
h := uint16(data[3])<<8 | uint16(data[4])
t.width = w
t.height = h
// 非阻塞发送 resize 事件
select {
case t.resizeCh <- remotecommand.TerminalSize{Width: w, Height: h}:
default:
}
}
continue
default: // 输入：跳过首字节（类型标记）
n := copy(p, data[1:])
return n, nil
}
}
}

func (t *wsTerminal) Write(p []byte) (int, error) {
t.mu.Lock()
defer t.mu.Unlock()
err := t.conn.WriteMessage(websocket.BinaryMessage, p)
if err != nil {
return 0, err
}
return len(p), nil
}

func (t *wsTerminal) Next() *remotecommand.TerminalSize {
t.startOnce.Do(t.init)
// 首次返回当前尺寸（如已设置），之后阻塞等待 resize
select {
case sz, ok := <-t.resizeCh:
if !ok {
return nil
}
return &sz
default:
// channel 为空时，返回 nil 表示暂无 resize
}
return nil
}

var _ = io.EOF