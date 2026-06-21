package handler

import (
"net/http"

"k8s-demo/internal/model"

"github.com/gin-gonic/gin"
corev1 "k8s.io/api/core/v1"
"k8s.io/apimachinery/pkg/apis/meta/v1"
)

type ServiceHandler struct{}

// List 列出 Service
func (h *ServiceHandler) List(c *gin.Context) {
cs, err := getActive()
if err != nil {
fail(c, http.StatusBadRequest, err.Error())
return
}
ns := c.DefaultQuery("namespace", "")
list, err := cs.Kubernetes.CoreV1().Services(ns).List(c.Request.Context(), listOptions(c))
if err != nil {
fail(c, http.StatusInternalServerError, err.Error())
return
}
items := make([]gin.H, 0, len(list.Items))
for _, s := range list.Items {
items = append(items, gin.H{
"name":       s.Name,
"namespace":  s.Namespace,
"type":       string(s.Spec.Type),
"clusterIP":  s.Spec.ClusterIP,
"externalIP": externalIPs(s),
"ports":      servicePorts(s),
"age":        model.TimeFormat(s.CreationTimestamp.Time),
"createdAt":  s.CreationTimestamp.Time.Unix(),
"selector":   s.Spec.Selector,
})
}
c.JSON(http.StatusOK, model.Success(gin.H{"total": len(items), "items": items}))
}

// Detail 详情
func (h *ServiceHandler) Detail(c *gin.Context) {
cs, err := getActive()
if err != nil {
fail(c, http.StatusBadRequest, err.Error())
return
}
s, err := cs.Kubernetes.CoreV1().Services(c.Param("namespace")).Get(c.Request.Context(), c.Param("name"), getOpts())
if err != nil {
fail(c, http.StatusInternalServerError, err.Error())
return
}
c.JSON(http.StatusOK, model.Success(s))
}

// Create 创建
func (h *ServiceHandler) Create(c *gin.Context) {
cs, err := getActive()
if err != nil {
fail(c, http.StatusBadRequest, err.Error())
return
}
var s corev1.Service
if err := c.ShouldBindJSON(&s); err != nil {
fail(c, http.StatusBadRequest, "参数错误: "+err.Error())
return
}
result, err := cs.Kubernetes.CoreV1().Services(s.Namespace).Create(c.Request.Context(), &s, v1.CreateOptions{})
if err != nil {
fail(c, http.StatusInternalServerError, err.Error())
return
}
c.JSON(http.StatusOK, model.Success(result))
}

// Delete 删除
func (h *ServiceHandler) Delete(c *gin.Context) {
cs, err := getActive()
if err != nil {
fail(c, http.StatusBadRequest, err.Error())
return
}
if err := cs.Kubernetes.CoreV1().Services(c.Param("namespace")).Delete(c.Request.Context(), c.Param("name"), delOpts()); err != nil {
fail(c, http.StatusInternalServerError, err.Error())
return
}
c.JSON(http.StatusOK, model.Success(nil))
}

func servicePorts(s corev1.Service) []gin.H {
ports := make([]gin.H, 0, len(s.Spec.Ports))
for _, p := range s.Spec.Ports {
ports = append(ports, gin.H{
"name":       p.Name,
"port":       p.Port,
"targetPort": p.TargetPort.String(),
"protocol":   string(p.Protocol),
"nodePort":   p.NodePort,
})
}
return ports
}

func externalIPs(s corev1.Service) string {
if len(s.Spec.ExternalIPs) > 0 {
return s.Spec.ExternalIPs[0]
}
if s.Status.LoadBalancer.Ingress != nil {
if s.Status.LoadBalancer.Ingress[0].IP != "" {
return s.Status.LoadBalancer.Ingress[0].IP
}
return s.Status.LoadBalancer.Ingress[0].Hostname
}
return "<none>"
}
