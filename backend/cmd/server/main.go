package main

import (
"log"
"os"
"os/signal"
"syscall"

"k8s-demo/internal/cluster"
"k8s-demo/internal/router"
)

func main() {
mgr := cluster.GetManager()

// 尝试 in-cluster 模式接入（平台自身部署在 K8S 中时自动接入）
if _, err := os.Stat("/var/run/secrets/kubernetes.io/serviceaccount/token"); err == nil {
if err := mgr.AddInCluster("in-cluster", "当前集群"); err == nil {
log.Println("[cluster] 已以 in-cluster 模式接入当前集群")
} else {
log.Printf("[cluster] in-cluster 接入失败: %v", err)
}
}

r := router.NewRouter()
port := os.Getenv("PORT")
if port == "" {
port = "8080"
}

go func() {
log.Printf("[server] K8S 容器管理平台启动，监听 :%s", port)
if err := r.Run(":" + port); err != nil {
log.Fatalf("服务启动失败: %v", err)
}
}()

quit := make(chan os.Signal, 1)
signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
<-quit
log.Println("[server] 正在退出...")
}