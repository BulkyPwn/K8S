package cluster

import (
"errors"
"sync"

"k8s.io/client-go/discovery"
"k8s.io/client-go/dynamic"
"k8s.io/client-go/kubernetes"
"k8s.io/client-go/rest"
"k8s.io/client-go/tools/clientcmd"
metricsv "k8s.io/metrics/pkg/client/clientset/versioned"
)

// ClusterInfo 描述一个被纳管的集群
type ClusterInfo struct {
ID        string `json:"id"`
Name      string `json:"name"`
Server    string `json:"server"`
Mode      string `json:"mode"` // in-cluster | kubeconfig
InCluster bool   `json:"inCluster"`
Active    bool   `json:"active"`
}

// ClientSet 封装一个集群所需的全部 client
type ClientSet struct {
Kubernetes *kubernetes.Clientset
Dynamic    dynamic.Interface
Discovery  *discovery.DiscoveryClient
Metrics    *metricsv.Clientset
RestConfig *rest.Config
}

// Manager 管理多集群接入
type Manager struct {
mu      sync.RWMutex
clients map[string]*ClientSet
infos   map[string]*ClusterInfo
active  string
}

var (
instance *Manager
once     sync.Once
)

// GetManager 单例
func GetManager() *Manager {
once.Do(func() {
instance = &Manager{
clients: make(map[string]*ClientSet),
infos:   make(map[string]*ClusterInfo),
}
})
return instance
}

func buildConfigFromKubeconfig(kubeconfig []byte) (*rest.Config, error) {
return clientcmd.RESTConfigFromKubeConfig(kubeconfig)
}

// AddInCluster 以 in-cluster 模式接入
func (m *Manager) AddInCluster(id, name string) error {
cfg, err := rest.InClusterConfig()
if err != nil {
return err
}
return m.add(id, name, cfg.Host, cfg, "in-cluster", true)
}

// AddByKubeconfig 通过 kubeconfig 内容接入
func (m *Manager) AddByKubeconfig(id, name string, kubeconfig []byte, setActive bool) error {
cfg, err := buildConfigFromKubeconfig(kubeconfig)
if err != nil {
return err
}
return m.add(id, name, cfg.Host, cfg, "kubeconfig", setActive)
}

func (m *Manager) add(id, name, server string, cfg *rest.Config, mode string, setActive bool) error {
cs, err := kubernetes.NewForConfig(cfg)
if err != nil {
return err
}
dyn, err := dynamic.NewForConfig(cfg)
if err != nil {
return err
}
dc, err := discovery.NewDiscoveryClientForConfig(cfg)
if err != nil {
return err
}
mc, err := metricsv.NewForConfig(cfg)
if err != nil {
return err
}

m.mu.Lock()
defer m.mu.Unlock()
m.clients[id] = &ClientSet{
Kubernetes: cs,
Dynamic:    dyn,
Discovery:  dc,
Metrics:    mc,
RestConfig: cfg,
}
m.infos[id] = &ClusterInfo{
ID: id, Name: name, Server: server, Mode: mode,
InCluster: mode == "in-cluster", Active: setActive,
}
if setActive {
m.active = id
for k := range m.infos {
if k != id {
m.infos[k].Active = false
}
}
}
return nil
}

// SetActive 切换激活集群
func (m *Manager) SetActive(id string) error {
m.mu.Lock()
defer m.mu.Unlock()
if _, ok := m.clients[id]; !ok {
return errors.New("cluster not found: " + id)
}
m.active = id
for k := range m.infos {
m.infos[k].Active = k == id
}
return nil
}

func (m *Manager) GetClientSet(id string) (*ClientSet, error) {
m.mu.RLock()
defer m.mu.RUnlock()
cs, ok := m.clients[id]
if !ok {
return nil, errors.New("cluster not found: " + id)
}
return cs, nil
}

func (m *Manager) GetActive() string {
m.mu.RLock()
defer m.mu.RUnlock()
return m.active
}

func (m *Manager) GetActiveClientSet() (*ClientSet, error) {
return m.GetClientSet(m.GetActive())
}

func (m *Manager) List() []*ClusterInfo {
m.mu.RLock()
defer m.mu.RUnlock()
list := make([]*ClusterInfo, 0, len(m.infos))
for _, info := range m.infos {
list = append(list, info)
}
return list
}

func (m *Manager) Remove(id string) {
m.mu.Lock()
defer m.mu.Unlock()
delete(m.clients, id)
delete(m.infos, id)
if m.active == id {
m.active = ""
}
}
