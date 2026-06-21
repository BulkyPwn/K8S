package handler

import (
"net/http"
"sort"

"k8s-demo/internal/model"

"github.com/gin-gonic/gin"
corev1 "k8s.io/api/core/v1"
)

type EventHandler struct{}

// List 列出事件
func (h *EventHandler) List(c *gin.Context) {
cs, err := getActive()
if err != nil {
fail(c, http.StatusBadRequest, err.Error())
return
}
ns := c.DefaultQuery("namespace", "")
fieldSelector := c.Query("fieldSelector")
opts := listOptions(c)
if fieldSelector != "" {
opts.FieldSelector = fieldSelector
}
list, err := cs.Kubernetes.CoreV1().Events(ns).List(c.Request.Context(), opts)
if err != nil {
fail(c, http.StatusInternalServerError, err.Error())
return
}
items := make([]gin.H, 0, len(list.Items))
for _, e := range list.Items {
items = append(items, gin.H{
"name":        e.Name,
"namespace":   e.Namespace,
"type":        e.Type,
"reason":      e.Reason,
"message":     e.Message,
"kind":        e.InvolvedObject.Kind,
"object":      e.InvolvedObject.Name,
"count":       e.Count,
"lastTime":    model.TimeFormat(e.LastTimestamp.Time),
"firstTime":   model.TimeFormat(e.FirstTimestamp.Time),
"lastTimeTs":  e.LastTimestamp.Time.Unix(),
})
}
// 按时间倒序
sort.Slice(items, func(i, j int) bool {
return items[i]["lastTimeTs"].(int64) > items[j]["lastTimeTs"].(int64)
})
c.JSON(http.StatusOK, model.Success(gin.H{"total": len(items), "items": items}))
}

// 保留 corev1 引用
var _ corev1.Event
