package handler

import (
"net/http"
"strconv"

"k8s-demo/internal/model"

"github.com/gin-gonic/gin"
appsv1 "k8s.io/api/apps/v1"
corev1 "k8s.io/api/core/v1"
"k8s.io/apimachinery/pkg/apis/meta/v1"
)

type DeploymentHandler struct{}

func (h *DeploymentHandler) List(c *gin.Context) {
cs, err := getActive()
if err != nil {
fail(c, http.StatusBadRequest, err.Error())
return
}
ns := c.DefaultQuery("namespace", "")
list, err := cs.Kubernetes.AppsV1().Deployments(ns).List(c.Request.Context(), listOptions(c))
if err != nil {
fail(c, http.StatusInternalServerError, err.Error())
return
}
items := make([]gin.H, 0, len(list.Items))
for _, d := range list.Items {
replicas := int32(0)
if d.Spec.Replicas != nil {
replicas = *d.Spec.Replicas
}
items = append(items, gin.H{
"name":       d.Name,
"namespace":  d.Namespace,
"ready":      strconv.Itoa(int(d.Status.ReadyReplicas)) + "/" + strconv.Itoa(int(replicas)),
"upToDate":   d.Status.UpdatedReplicas,
"available":  d.Status.AvailableReplicas,
"age":        model.TimeFormat(d.CreationTimestamp.Time),
"createdAt":  d.CreationTimestamp.Time.Unix(),
"images":     deploymentImages(d),
"labels":     d.Labels,
})
}
c.JSON(http.StatusOK, model.Success(gin.H{"total": len(items), "items": items}))
}

func (h *DeploymentHandler) Detail(c *gin.Context) {
cs, err := getActive()
if err != nil {
fail(c, http.StatusBadRequest, err.Error())
return
}
d, err := cs.Kubernetes.AppsV1().Deployments(c.Param("namespace")).Get(c.Request.Context(), c.Param("name"), getOpts())
if err != nil {
fail(c, http.StatusInternalServerError, err.Error())
return
}
c.JSON(http.StatusOK, model.Success(d))
}

func (h *DeploymentHandler) Create(c *gin.Context) {
cs, err := getActive()
if err != nil {
fail(c, http.StatusBadRequest, err.Error())
return
}
var d appsv1.Deployment
if err := c.ShouldBindJSON(&d); err != nil {
fail(c, http.StatusBadRequest, "参数错误: "+err.Error())
return
}
result, err := cs.Kubernetes.AppsV1().Deployments(d.Namespace).Create(c.Request.Context(), &d, v1.CreateOptions{})
if err != nil {
fail(c, http.StatusInternalServerError, err.Error())
return
}
c.JSON(http.StatusOK, model.Success(result))
}

func (h *DeploymentHandler) Update(c *gin.Context) {
cs, err := getActive()
if err != nil {
fail(c, http.StatusBadRequest, err.Error())
return
}
var d appsv1.Deployment
if err := c.ShouldBindJSON(&d); err != nil {
fail(c, http.StatusBadRequest, "参数错误: "+err.Error())
return
}
result, err := cs.Kubernetes.AppsV1().Deployments(c.Param("namespace")).Update(c.Request.Context(), &d, v1.UpdateOptions{})
if err != nil {
fail(c, http.StatusInternalServerError, err.Error())
return
}
c.JSON(http.StatusOK, model.Success(result))
}

func (h *DeploymentHandler) Delete(c *gin.Context) {
cs, err := getActive()
if err != nil {
fail(c, http.StatusBadRequest, err.Error())
return
}
if err := cs.Kubernetes.AppsV1().Deployments(c.Param("namespace")).Delete(c.Request.Context(), c.Param("name"), delOpts()); err != nil {
fail(c, http.StatusInternalServerError, err.Error())
return
}
c.JSON(http.StatusOK, model.Success(nil))
}

func (h *DeploymentHandler) Scale(c *gin.Context) {
cs, err := getActive()
if err != nil {
fail(c, http.StatusBadRequest, err.Error())
return
}
replicas, _ := strconv.Atoi(c.DefaultQuery("replicas", "1"))
d, err := cs.Kubernetes.AppsV1().Deployments(c.Param("namespace")).Get(c.Request.Context(), c.Param("name"), getOpts())
if err != nil {
fail(c, http.StatusInternalServerError, err.Error())
return
}
r := int32(replicas)
d.Spec.Replicas = &r
if _, err := cs.Kubernetes.AppsV1().Deployments(c.Param("namespace")).Update(c.Request.Context(), d, v1.UpdateOptions{}); err != nil {
fail(c, http.StatusInternalServerError, err.Error())
return
}
c.JSON(http.StatusOK, model.Success(gin.H{"replicas": r}))
}

func (h *DeploymentHandler) Restart(c *gin.Context) {
cs, err := getActive()
if err != nil {
fail(c, http.StatusBadRequest, err.Error())
return
}
d, err := cs.Kubernetes.AppsV1().Deployments(c.Param("namespace")).Get(c.Request.Context(), c.Param("name"), getOpts())
if err != nil {
fail(c, http.StatusInternalServerError, err.Error())
return
}
if d.Spec.Template.Annotations == nil {
d.Spec.Template.Annotations = map[string]string{}
}
d.Spec.Template.Annotations["kubectl.kubernetes.io/restartedAt"] = v1.Now().String()
if _, err := cs.Kubernetes.AppsV1().Deployments(c.Param("namespace")).Update(c.Request.Context(), d, v1.UpdateOptions{}); err != nil {
fail(c, http.StatusInternalServerError, err.Error())
return
}
c.JSON(http.StatusOK, model.Success(nil))
}

func deploymentImages(d appsv1.Deployment) []string {
imgs := []string{}
for _, c := range d.Spec.Template.Spec.Containers {
imgs = append(imgs, c.Image)
}
return imgs
}

func deploymentContainers(d appsv1.Deployment) []gin.H {
result := make([]gin.H, 0)
for _, c := range d.Spec.Template.Spec.Containers {
result = append(result, gin.H{
"name":  c.Name,
"image": c.Image,
"ports": containerPorts(c),
})
}
return result
}

func containerPorts(c corev1.Container) []gin.H {
ports := make([]gin.H, 0)
for _, p := range c.Ports {
ports = append(ports, gin.H{"name": p.Name, "containerPort": p.ContainerPort, "protocol": string(p.Protocol)})
}
return ports
}