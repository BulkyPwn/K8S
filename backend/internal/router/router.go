package router

import (
"k8s-demo/internal/handler"
"k8s-demo/internal/middleware"

"github.com/gin-gonic/gin"
)

// NewRouter 构建路由
func NewRouter() *gin.Engine {
gin.SetMode(gin.ReleaseMode)
r := gin.Default()
r.Use(middleware.CORS())

podH := &handler.PodHandler{}
deployH := &handler.DeploymentHandler{}
svcH := &handler.ServiceHandler{}
nodeH := &handler.NodeHandler{}
nsH := &handler.NamespaceHandler{}
eventH := &handler.EventHandler{}
logH := &handler.LogHandler{}
execH := &handler.ExecHandler{}
metricsH := &handler.MetricsHandler{}
clusterH := &handler.ClusterHandler{}

api := r.Group("/api/v1")
{
// 集群管理
api.GET("/clusters", clusterH.List)
api.POST("/clusters", clusterH.Add)
api.PUT("/clusters/:id/active", clusterH.Switch)
api.DELETE("/clusters/:id", clusterH.Remove)
api.GET("/clusters/status", clusterH.Status)

// 命名空间
api.GET("/namespaces", nsH.List)
api.POST("/namespaces", nsH.Create)
api.DELETE("/namespaces/:name", nsH.Delete)

// 节点
api.GET("/nodes", nodeH.List)
api.GET("/nodes/:name", nodeH.Detail)

// Pod
api.GET("/pods", podH.List)
api.GET("/namespaces/:namespace/pods/:name", podH.Detail)
api.DELETE("/namespaces/:namespace/pods/:name", podH.Delete)
api.GET("/namespaces/:namespace/pods/:name/logs", logH.Logs)
api.GET("/namespaces/:namespace/pods/:name/exec", execH.Exec)

// Deployment
api.GET("/deployments", deployH.List)
api.GET("/namespaces/:namespace/deployments/:name", deployH.Detail)
api.POST("/namespaces/:namespace/deployments", deployH.Create)
api.PUT("/namespaces/:namespace/deployments/:name", deployH.Update)
api.DELETE("/namespaces/:namespace/deployments/:name", deployH.Delete)
api.PUT("/namespaces/:namespace/deployments/:name/scale", deployH.Scale)
api.PUT("/namespaces/:namespace/deployments/:name/restart", deployH.Restart)

// Service
api.GET("/services", svcH.List)
api.GET("/namespaces/:namespace/services/:name", svcH.Detail)
api.POST("/namespaces/:namespace/services", svcH.Create)
api.DELETE("/namespaces/:namespace/services/:name", svcH.Delete)

// 事件
api.GET("/events", eventH.List)

// 指标
api.GET("/metrics/cluster", metricsH.ClusterOverview)
api.GET("/metrics/nodes", metricsH.NodeMetrics)
api.GET("/metrics/pods", metricsH.PodMetrics)
}

// 健康检查
r.GET("/healthz", func(c *gin.Context) { c.JSON(200, gin.H{"status": "ok"}) })

return r
}
