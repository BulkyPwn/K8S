package handler

import (
"k8s-demo/internal/cluster"
"k8s-demo/internal/model"
"net/http"
"strconv"

"github.com/gin-gonic/gin"
"k8s.io/apimachinery/pkg/apis/meta/v1"
)

// getActive 获取当前激活集群的 clientset
func getActive() (*cluster.ClientSet, error) {
return cluster.GetManager().GetActiveClientSet()
}

// listOptions 从 query 构造分页 ListOptions
func listOptions(c *gin.Context) v1.ListOptions {
opts := v1.ListOptions{}
if l := c.Query("limit"); l != "" {
if n, err := strconv.ParseInt(l, 10, 64); err == nil && n > 0 {
opts.Limit = n
}
}
if fs := c.Query("fieldSelector"); fs != "" {
opts.FieldSelector = fs
}
if ls := c.Query("labelSelector"); ls != "" {
opts.LabelSelector = ls
}
return opts
}

func getOpts() v1.GetOptions    { return v1.GetOptions{} }
func delOpts() v1.DeleteOptions { return v1.DeleteOptions{} }

// fail 统一错误返回
func fail(c *gin.Context, code int, msg string) {
c.JSON(code, model.Error(msg))
}
