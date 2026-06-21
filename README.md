# K8S 容器管理平台

一个自研的 Kubernetes 多集群统一管理控制台，覆盖 K8S 核心特性并支持可视化。

## 技术栈

| 层 | 技术 |
|---|---|
| 后端 | Go 1.21+ · Gin · client-go · gorilla/websocket |
| 前端 | React 18 · TypeScript · Vite · Ant Design 5 · ECharts · xterm.js · Monaco |
| 依赖 | Metrics Server（可选，用于资源监控） |

## 功能特性

- **集群管理**：支持 in-cluster 自动接入 + kubeconfig 多集群纳管 + 一键切换
- **工作负载**：Pod / Deployment 列表详情、弹性伸缩、滚动重启、删除
- **网络**：Service（ClusterIP/NodePort/LoadBalancer）列表与端口可视化
- **节点 / 命名空间**：节点角色/版本/资源容量、命名空间创建/删除
- **日志**：SSE 实时流式日志、容器切换、关键字过滤、导出
- **终端**：基于 xterm.js + WebSocket 的 Pod exec Web 终端
- **YAML 编辑器**：基于 Monaco 的在线查看与编辑
- **实时监控**：CPU/内存仪表盘、节点角色分布、集群总览（需 Metrics Server）
- **事件**：实时 K8S Event 流、类型/关键字过滤

## 目录结构

```
K8S_Demo/
├── backend/
│   ├── cmd/server/main.go        # 入口
│   ├── internal/
│   │   ├── cluster/manager.go    # 多集群管理器（in-cluster + kubeconfig）
│   │   ├── handler/              # Pod/Deployment/Service/Node/Namespace/Event/Log/Exec/Metrics/Cluster
│   │   ├── middleware/cors.go    # CORS 中间件
│   │   ├── model/response.go     # 统一响应
│   │   └── router/router.go      # 路由
│   └── go.mod
├── frontend/
│   ├── src/
│   │   ├── api/                  # axios 客户端 + 资源 API
│   │   ├── components/           # YamlEditor / Terminal / LogViewer
│   │   ├── layouts/MainLayout.tsx
│   │   ├── pages/                # Dashboard/Pods/PodDetail/Deployments/Services/Nodes/Namespaces/Events/Clusters
│   │   ├── store/app.ts          # zustand 全局状态
│   │   └── types/index.ts
│   └── package.json
└── README.md
```

## 快速开始

### 1. 启动后端

需要先安装 Go 1.21+（https://go.dev/dl/ ）。

```powershell
cd backend
go mod tidy
go run ./cmd/server/main.go
# 默认监听 :8080
```

如果后端运行在集群外，启动后请通过前端「集群管理」页面用 kubeconfig 接入集群。

### 2. 启动前端

```powershell
cd frontend
npm install
npm run dev
# 默认监听 :3000，已配置代理转发到后端 :8080
```

浏览器打开 http://localhost:3000 即可。

### 3. 接入集群

- 页面打开后默认未接入集群，顶部显示「未连接集群」
- 进入「集群管理」→「接入集群」→ 填写名称并粘贴 kubeconfig
- 获取 kubeconfig：`kubectl config view --raw --minify`
- 接入成功后即可在顶部切换集群、选择命名空间，浏览所有资源

## 部署到 K8S（In-Cluster 模式）

把后端打包成镜像并以 Deployment 部署到集群内，配合 ServiceAccount 即可自动以 in-cluster 模式接入，无需 kubeconfig。

示例（需自行构建镜像）：

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: k8s-platform
  namespace: kube-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: k8s-platform
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
  - kind: ServiceAccount
    name: k8s-platform
    namespace: kube-system
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: k8s-platform
  namespace: kube-system
spec:
  replicas: 1
  selector:
    matchLabels:
      app: k8s-platform
  template:
    metadata:
      labels:
        app: k8s-platform
    spec:
      serviceAccountName: k8s-platform
      containers:
        - name: backend
          image: your-registry/k8s-platform:latest
          ports:
            - containerPort: 8080
```

## 后续可扩展

本平台为 P1+P2 基础版本，可继续扩展的 K8S 特性：
- StatefulSet / DaemonSet / Job / CronJob 管理
- Ingress / NetworkPolicy 可视化拓扑
- PV / PVC / StorageClass 存储管理
- ConfigMap / Secret 配置管理
- RBAC（Role/ClusterRole/Binding）权限矩阵
- HPA / VPA 自动扩缩容
- CRD 通用管理 + Helm 应用商店
- 资源关系拓扑图（Cytoscape 力导向）
