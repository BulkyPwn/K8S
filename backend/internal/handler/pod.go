package handler

import (
"net/http"

"k8s-demo/internal/model"

"github.com/gin-gonic/gin"
corev1 "k8s.io/api/core/v1"
)

type PodHandler struct{}

// List 列出 Pod
func (h *PodHandler) List(c *gin.Context) {
cs, err := getActive()
if err != nil {
fail(c, http.StatusBadRequest, err.Error())
return
}
ns := c.DefaultQuery("namespace", "")
list, err := cs.Kubernetes.CoreV1().Pods(ns).List(c.Request.Context(), listOptions(c))
if err != nil {
fail(c, http.StatusInternalServerError, err.Error())
return
}
items := make([]gin.H, 0, len(list.Items))
for _, p := range list.Items {
items = append(items, gin.H{
"name":       p.Name,
"namespace":  p.Namespace,
"status":     string(p.Status.Phase),
"podIP":      p.Status.PodIP,
"node":       p.Spec.NodeName,
"restarts":   totalRestarts(p),
"ready":      readyRatio(p),
"age":        model.TimeFormat(p.CreationTimestamp.Time),
"createdAt":  p.CreationTimestamp.Time.Unix(),
"labels":     p.Labels,
"containers": containerSummaries(p),
})
}
c.JSON(http.StatusOK, model.Success(gin.H{"total": len(items), "items": items}))
}

// Detail Pod 详情
func (h *PodHandler) Detail(c *gin.Context) {
cs, err := getActive()
if err != nil {
fail(c, http.StatusBadRequest, err.Error())
return
}
p, err := cs.Kubernetes.CoreV1().Pods(c.Param("namespace")).Get(c.Request.Context(), c.Param("name"), getOpts())
if err != nil {
fail(c, http.StatusInternalServerError, err.Error())
return
}
c.JSON(http.StatusOK, model.Success(p))
}

// Delete 删除 Pod
func (h *PodHandler) Delete(c *gin.Context) {
cs, err := getActive()
if err != nil {
fail(c, http.StatusBadRequest, err.Error())
return
}
if err := cs.Kubernetes.CoreV1().Pods(c.Param("namespace")).Delete(c.Request.Context(), c.Param("name"), delOpts()); err != nil {
fail(c, http.StatusInternalServerError, err.Error())
return
}
c.JSON(http.StatusOK, model.Success(nil))
}

func containerSummaries(p corev1.Pod) []gin.H {
result := make([]gin.H, 0, len(p.Spec.Containers))
statusMap := map[string]corev1.ContainerStatus{}
for _, s := range p.Status.ContainerStatuses {
statusMap[s.Name] = s
}
for _, ctr := range p.Spec.Containers {
ready := false
restarts := int32(0)
state := "waiting"
if s, ok := statusMap[ctr.Name]; ok {
ready = s.Ready
restarts = s.RestartCount
if s.State.Running != nil {
state = "running"
} else if s.State.Terminated != nil {
state = "terminated"
}
}
result = append(result, gin.H{
"name": ctr.Name, "image": ctr.Image,
"ready": ready, "restarts": restarts, "state": state,
})
}
return result
}

func totalRestarts(p corev1.Pod) int32 {
var t int32
for _, s := range p.Status.ContainerStatuses {
t += s.RestartCount
}
return t
}

func readyRatio(p corev1.Pod) string {
ready, total := 0, len(p.Spec.Containers)
for _, s := range p.Status.ContainerStatuses {
if s.Ready {
ready++
}
}
return itoa(ready) + "/" + itoa(total)
}

func itoa(i int) string {
if i == 0 {
return "0"
}
var b []byte
for i > 0 {
b = append([]byte{byte('0' + i%10)}, b...)
i /= 10
}
return string(b)
}
