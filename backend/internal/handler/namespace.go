package handler

import (
"net/http"

"k8s-demo/internal/model"

"github.com/gin-gonic/gin"
corev1 "k8s.io/api/core/v1"
"k8s.io/apimachinery/pkg/apis/meta/v1"
)

type NamespaceHandler struct{}

func (h *NamespaceHandler) List(c *gin.Context) {
cs, err := getActive()
if err != nil {
fail(c, http.StatusBadRequest, err.Error())
return
}
list, err := cs.Kubernetes.CoreV1().Namespaces().List(c.Request.Context(), listOptions(c))
if err != nil {
fail(c, http.StatusInternalServerError, err.Error())
return
}
items := make([]gin.H, 0, len(list.Items))
for _, n := range list.Items {
status := "Active"
if n.Status.Phase != "" {
status = string(n.Status.Phase)
}
items = append(items, gin.H{
"name":      n.Name,
"status":    status,
"age":       model.TimeFormat(n.CreationTimestamp.Time),
"createdAt": n.CreationTimestamp.Time.Unix(),
"labels":    n.Labels,
})
}
c.JSON(http.StatusOK, model.Success(gin.H{"total": len(items), "items": items}))
}

func (h *NamespaceHandler) Create(c *gin.Context) {
cs, err := getActive()
if err != nil {
fail(c, http.StatusBadRequest, err.Error())
return
}
var req struct {
Name   string            `json:"name"`
Labels map[string]string `json:"labels"`
}
if err := c.ShouldBindJSON(&req); err != nil {
fail(c, http.StatusBadRequest, "参数错误: "+err.Error())
return
}
ns := &corev1.Namespace{ObjectMeta: v1.ObjectMeta{Name: req.Name, Labels: req.Labels}}
result, err := cs.Kubernetes.CoreV1().Namespaces().Create(c.Request.Context(), ns, v1.CreateOptions{})
if err != nil {
fail(c, http.StatusInternalServerError, err.Error())
return
}
c.JSON(http.StatusOK, model.Success(result))
}

func (h *NamespaceHandler) Delete(c *gin.Context) {
cs, err := getActive()
if err != nil {
fail(c, http.StatusBadRequest, err.Error())
return
}
if err := cs.Kubernetes.CoreV1().Namespaces().Delete(c.Request.Context(), c.Param("name"), delOpts()); err != nil {
fail(c, http.StatusInternalServerError, err.Error())
return
}
c.JSON(http.StatusOK, model.Success(nil))
}