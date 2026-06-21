package handler

import (
"fmt"
"io"
"net/http"

"github.com/gin-gonic/gin"
corev1 "k8s.io/api/core/v1"
)

type LogHandler struct{}

// Logs 获取 Pod 日志（SSE 流式）
func (h *LogHandler) Logs(c *gin.Context) {
cs, err := getActive()
if err != nil {
fail(c, http.StatusBadRequest, err.Error())
return
}
ns := c.Param("namespace")
name := c.Param("name")
container := c.Query("container")
follow := c.Query("follow") == "true"
tailLines := c.Query("tailLines")
previous := c.Query("previous") == "true"

opts := &corev1.PodLogOptions{
Container: container,
Follow:    follow,
Previous:  previous,
}
if tailLines != "" {
var tl int64
fmt.Sscanf(tailLines, "%d", &tl)
opts.TailLines = &tl
}

req := cs.Kubernetes.CoreV1().Pods(ns).GetLogs(name, opts)
stream, err := req.Stream(c.Request.Context())
if err != nil {
fail(c, http.StatusInternalServerError, err.Error())
return
}
defer stream.Close()

c.Writer.Header().Set("Content-Type", "text/event-stream")
c.Writer.Header().Set("Cache-Control", "no-cache")
c.Writer.Header().Set("Connection", "keep-alive")
c.Writer.Header().Set("X-Accel-Buffering", "no")
c.Writer.Flush()

buf := make([]byte, 4096)
for {
n, err := stream.Read(buf)
if n > 0 {
fmt.Fprintf(c.Writer, "data: %s\n\n", buf[:n])
c.Writer.Flush()
}
if err != nil {
if err != io.EOF {
fmt.Fprintf(c.Writer, "event: error\ndata: %s\n\n", err.Error())
c.Writer.Flush()
}
break
}
}
}
