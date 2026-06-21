package handler

import (
"net/http"

"k8s-demo/internal/model"

"github.com/gin-gonic/gin"
corev1 "k8s.io/api/core/v1"
)

type NodeHandler struct{}

// List 列出 Node
func (h *NodeHandler) List(c *gin.Context) {
cs, err := getActive()
if err != nil {
fail(c, http.StatusBadRequest, err.Error())
return
}
list, err := cs.Kubernetes.CoreV1().Nodes().List(c.Request.Context(), listOptions(c))
if err != nil {
fail(c, http.StatusInternalServerError, err.Error())
return
}
items := make([]gin.H, 0, len(list.Items))
for _, n := range list.Items {
items = append(items, gin.H{
"name":      n.Name,
"status":    nodeCondition(n),
"role":      nodeRole(n),
"version":   n.Status.NodeInfo.KubeletVersion,
"os":        n.Status.NodeInfo.OperatingSystem,
"arch":      n.Status.NodeInfo.Architecture,
"ip":        nodeInternalIP(n),
"capacity":  n.Status.Capacity,
"age":       model.TimeFormat(n.CreationTimestamp.Time),
"createdAt": n.CreationTimestamp.Time.Unix(),
"labels":    n.Labels,
})
}
c.JSON(http.StatusOK, model.Success(gin.H{"total": len(items), "items": items}))
}

// Detail 详情
func (h *NodeHandler) Detail(c *gin.Context) {
cs, err := getActive()
if err != nil {
fail(c, http.StatusBadRequest, err.Error())
return
}
n, err := cs.Kubernetes.CoreV1().Nodes().Get(c.Request.Context(), c.Param("name"), getOpts())
if err != nil {
fail(c, http.StatusInternalServerError, err.Error())
return
}
c.JSON(http.StatusOK, model.Success(n))
}

func nodeCondition(n corev1.Node) string {
for _, cond := range n.Status.Conditions {
if cond.Type == corev1.NodeReady {
if cond.Status == corev1.ConditionTrue {
return "Ready"
}
return "NotReady"
}
}
return "Unknown"
}

func nodeRole(n corev1.Node) string {
for k := range n.Labels {
if k == "kubernetes.io/role" {
return n.Labels[k]
}
if _, ok := n.Labels["node-role.kubernetes.io/control-plane"]; ok {
return "control-plane"
}
if _, ok := n.Labels["node-role.kubernetes.io/master"]; ok {
return "master"
}
}
return "worker"
}

func nodeInternalIP(n corev1.Node) string {
for _, addr := range n.Status.Addresses {
if addr.Type == corev1.NodeInternalIP {
return addr.Address
}
}
return ""
}
