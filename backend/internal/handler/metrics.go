package handler

import (
"net/http"

"k8s-demo/internal/model"

"github.com/gin-gonic/gin"
"k8s.io/apimachinery/pkg/api/resource"
metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type MetricsHandler struct{}

// NodeMetrics 节点资源指标
func (h *MetricsHandler) NodeMetrics(c *gin.Context) {
cs, err := getActive()
if err != nil {
fail(c, http.StatusBadRequest, err.Error())
return
}
list, err := cs.Metrics.MetricsV1beta1().NodeMetricses().List(c.Request.Context(), metav1.ListOptions{})
if err != nil {
fail(c, http.StatusInternalServerError, err.Error())
return
}
items := make([]gin.H, 0, len(list.Items))
for _, m := range list.Items {
items = append(items, gin.H{
"name":      m.Name,
"cpu":       m.Usage.Cpu().String(),
"cpuNano":   m.Usage.Cpu().MilliValue(),
"memory":    m.Usage.Memory().String(),
"memoryKi":  m.Usage.Memory().Value() / 1024,
})
}
c.JSON(http.StatusOK, model.Success(gin.H{"total": len(items), "items": items}))
}

// PodMetrics Pod 资源指标
func (h *MetricsHandler) PodMetrics(c *gin.Context) {
cs, err := getActive()
if err != nil {
fail(c, http.StatusBadRequest, err.Error())
return
}
ns := c.DefaultQuery("namespace", "")
list, err := cs.Metrics.MetricsV1beta1().PodMetricses(ns).List(c.Request.Context(), metav1.ListOptions{})
if err != nil {
fail(c, http.StatusInternalServerError, err.Error())
return
}
items := make([]gin.H, 0, len(list.Items))
for _, m := range list.Items {
containers := make([]gin.H, 0, len(m.Containers))
var totalCPU, totalMem int64
for _, ctr := range m.Containers {
cpu := ctr.Usage.Cpu().MilliValue()
mem := ctr.Usage.Memory().Value() / 1024
totalCPU += cpu
totalMem += mem
containers = append(containers, gin.H{
"name":     ctr.Name,
"cpu":      ctr.Usage.Cpu().String(),
"cpuNano":  cpu,
"memory":   ctr.Usage.Memory().String(),
"memoryKi": mem,
})
}
items = append(items, gin.H{
"name":       m.Name,
"namespace":  m.Namespace,
"cpuNano":    totalCPU,
"memoryKi":   totalMem,
"containers": containers,
})
}
c.JSON(http.StatusOK, model.Success(gin.H{"total": len(items), "items": items}))
}

// ClusterOverview 集群总览（节点容量 + 已用）
func (h *MetricsHandler) ClusterOverview(c *gin.Context) {
cs, err := getActive()
if err != nil {
fail(c, http.StatusBadRequest, err.Error())
return
}
nodes, err := cs.Kubernetes.CoreV1().Nodes().List(c.Request.Context(), metav1.ListOptions{})
if err != nil {
fail(c, http.StatusInternalServerError, err.Error())
return
}
pods, err := cs.Kubernetes.CoreV1().Pods("").List(c.Request.Context(), metav1.ListOptions{})
if err != nil {
fail(c, http.StatusInternalServerError, err.Error())
return
}

var totalCPU, totalMem int64
runningPods := 0
for _, n := range nodes.Items {
totalCPU += n.Status.Capacity.Cpu().MilliValue()
totalMem += n.Status.Capacity.Memory().Value() / 1024
}
for _, p := range pods.Items {
if p.Status.Phase == "Running" {
runningPods++
}
}

// 使用 metrics 计算已用
usedCPU, usedMem := int64(0), int64(0)
if ml, err := cs.Metrics.MetricsV1beta1().NodeMetricses().List(c.Request.Context(), metav1.ListOptions{}); err == nil {
for _, m := range ml.Items {
usedCPU += m.Usage.Cpu().MilliValue()
usedMem += m.Usage.Memory().Value() / 1024
}
}

// 保留 resource 引用以备用
_ = resource.Quantity{}

c.JSON(http.StatusOK, model.Success(gin.H{
"nodeCount":    len(nodes.Items),
"podCount":     len(pods.Items),
"runningPods":  runningPods,
"totalCPU":     totalCPU,
"usedCPU":      usedCPU,
"totalMemory":  totalMem,
"usedMemory":   usedMem,
}))
}
