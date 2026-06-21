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
fail(c, http.StatusBadRequest, err.Error())
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
fail(c, http.StatusInternalServerError, err.Error())
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
}

func (t *wsTerminal) Read(p []byte) (int, error) {
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
t.width = uint16(data[1])<<8 | uint16(data[2])
t.height = uint16(data[3])<<8 | uint16(data[4])
}
continue
default: // 输入
n := copy(p, data)
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
if t.width == 0 {
return nil
}
return &remotecommand.TerminalSize{Width: t.width, Height: t.height}
}

var _ = io.EOF
