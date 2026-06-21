package handler

import (
"fmt"
"net/http"

"k8s-demo/internal/cluster"
"k8s-demo/internal/model"

"github.com/gin-gonic/gin"
)

type ClusterHandler struct{}

// List 列出所有接入集群
func (h *ClusterHandler) List(c *gin.Context) {
c.JSON(http.StatusOK, model.Success(cluster.GetManager().List()))
}

// Add 通过 kubeconfig 接入新集群
func (h *ClusterHandler) Add(c *gin.Context) {
var req struct {
Name       string `json:"name"`
Kubeconfig string `json:"kubeconfig"`
}
if err := c.ShouldBindJSON(&req); err != nil {
fail(c, http.StatusBadRequest, "参数错误: "+err.Error())
return
}
if req.Name == "" || req.Kubeconfig == "" {
fail(c, http.StatusBadRequest, "name 和 kubeconfig 不能为空")
return
}
id := "cluster-" + fmt.Sprintf("%d", len(cluster.GetManager().List())+1)
if err := cluster.GetManager().AddByKubeconfig(id, req.Name, []byte(req.Kubeconfig), true); err != nil {
fail(c, http.StatusInternalServerError, err.Error())
return
}
c.JSON(http.StatusOK, model.Success(gin.H{"id": id}))
}

// Switch 切换激活集群
func (h *ClusterHandler) Switch(c *gin.Context) {
id := c.Param("id")
if err := cluster.GetManager().SetActive(id); err != nil {
fail(c, http.StatusBadRequest, err.Error())
return
}
c.JSON(http.StatusOK, model.Success(nil))
}

// Remove 移除集群
func (h *ClusterHandler) Remove(c *gin.Context) {
id := c.Param("id")
cluster.GetManager().Remove(id)
c.JSON(http.StatusOK, model.Success(nil))
}

// Status 当前激活集群及是否有可用集群
func (h *ClusterHandler) Status(c *gin.Context) {
mgr := cluster.GetManager()
active := mgr.GetActive()
c.JSON(http.StatusOK, model.Success(gin.H{
"active":   active,
"count":    len(mgr.List()),
"ready":    active != "",
}))
}
