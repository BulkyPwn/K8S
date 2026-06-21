# ☸ K8S 容器管理平台

一个自研的 **Kubernetes 多集群统一管理控制台**，覆盖 K8S 核心工作负载/网络/存储/安全等特性，支持可视化仪表盘、Web 终端、实时日志和在线 YAML 编辑。

---

## 架构

```
+------------------------------------------------------------+
|  前端 (React 18 + TS + Vite + Ant Design 5 + ECharts)      |
|  可视化仪表盘 · 拓扑图 · YAML编辑器(Monaco) · 终端(xterm)     |
+----------------------------+-------------------------------+
                             | REST · WebSocket · SSE
+----------------------------+-------------------------------+
|  后端 (Go 1.21 + Gin + client-go + gorilla/websocket)      |
|  多集群管理 · Informer缓存 · API · 日志流 · exec终端         |
+----------------------------+-------------------------------+
                             | In-Cluster / Kubeconfig
+----------------------------+-------------------------------+
|  目标 K8S 集群 (主/多集群)                                   |
|  Metrics Server · Prometheus · Nodes · Pods · Services       |
+------------------------------------------------------------+
```

---

## 功能矩阵

| 模块 | 功能 | 状态 |
|---|---|---|
| **集群总览** | CPU/内存仪表盘 · 节点/Pod 统计 · 角色分布饼图 · 10s 自动刷新 | ✅ |
| **节点** | 列表查看 · 角色识别 · 版本/架构 · 内网IP · 状态标签 | ✅ |
| **命名空间** | 列表 · 新建 · 删除 · 全局过滤 | ✅ |
| **Pod** | 列表 · 详情 · 删除 · 命名空间过滤 · 关键字搜索 | ✅ |
| **工作负载 (Deployment)** | 列表 · 详情 · 新建 · YAML 更新 · 弹性伸缩 · 滚动重启 · 删除 | ✅ |
| **服务 (Service)** | 列表 · 详情 · 新建 · 删除 · 端口可视化 · ClusterIP/NodePort/LB | ✅ |
| **事件** | 实时流 · 按类型/关键字过滤 · 按时间倒序 | ✅ |
| **日志** | SSE 实时流 · 容器切换 · 跟随/非跟随 · 关键字高亮 · 导出 | ✅ |
| **Web 终端** | xterm.js + WebSocket · Pod exec · 窗口自适应 · /bin/sh | ✅ |
| **YAML 查看** | Monaco Editor · 资源详情 JSON 在线查看 | ✅ |
| **多集群管理** | kubeconfig 接入 · In-Cluster 自动发现 · 一键切换 · 移除 | ✅ |

---

## 技术栈

| 层 | 技术选型 | 说明 |
|---|---|---|
| 后端语言 | **Go 1.21+** | client-go 原生支持 |
| Web 框架 | **Gin v1.10** | 高性能、中间件丰富 |
| K8S 交互 | **client-go v0.30** + dynamic client + metrics | 内置资源 + CRD + Metrics API |
| 终端桥接 | **gorilla/websocket** | WebSocket → SPDY remotecommand |
| 前端框架 | **React 18 + TypeScript** | Hooks + 类型安全 |
| 构建工具 | **Vite 5** | 极速 HMR + 生产构建 |
| UI 组件库 | **Ant Design 5** | 企业级后台管理 |
| 图表 | **ECharts + echarts-for-react** | Gauge 仪表盘 · Pie 饼图 |
| 代码编辑器 | **@monaco-editor/react** | VS Code 内核 YAML 编辑器 |
| Web 终端 | **xterm.js 5** | ANSI 终端模拟 |
| 状态管理 | **zustand** | 轻量全局命名空间/集群状态 |
| 前置依赖 | **Metrics Server**（可选） | 集群资源监控数据来源 |

---

## 目录结构

```
K8S_Demo/
├── backend/
│   ├── cmd/server/main.go              # 服务入口
│   ├── internal/
│   │   ├── cluster/manager.go          # 多集群管理器 (In-Cluster + Kubeconfig)
│   │   ├── handler/
│   │   │   ├── helpers.go              # 公共工具 (listOptions/getActive/fail)
│   │   │   ├── cluster.go             # POST/GET 集群接入/切换/移除
│   │   │   ├── pod.go                 # GET list/detail · DELETE
│   │   │   ├── deployment.go          # CRUD + scale + restart
│   │   │   ├── service.go             # CRUD + 端口可视化
│   │   │   ├── node.go                # list/detail + 角色识别
│   │   │   ├── namespace.go           # list/create/delete
│   │   │   ├── event.go               # 事件列表 (排序/过滤)
│   │   │   ├── metrics.go             # 节点/Pod/集群资源指标
│   │   │   ├── log.go                 # SSE 日志流 / 纯文本一次性拉取
│   │   │   └── exec.go                # WebSocket → remotecommand exec 桥接
│   │   ├── middleware/cors.go         # CORS 中间件
│   │   ├── model/response.go          # 统一 JSON 响应
│   │   └── router/router.go           # RESTful 路由注册
│   └── go.mod
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts              # axios 实例 + 拦截器
│   │   │   └── resources.ts           # 全部资源 API + logUrl/execWsUrl 构造函数
│   │   ├── components/
│   │   │   ├── YamlEditor.tsx         # Monaco 编辑器封装
│   │   │   ├── Terminal.tsx           # xterm.js + WebSocket 终端
│   │   │   └── LogViewer.tsx          # SSE 日志查看器 (过滤/导出)
│   │   ├── layouts/MainLayout.tsx     # 侧边栏 + 命名空间/集群选择器
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx          # 集群总览 (仪表盘 + 节点表)
│   │   │   ├── Pods.tsx              # Pod 列表 (搜索/删除)
│   │   │   ├── PodDetail.tsx         # Pod 详情 (日志/终端/JSON/容器)
│   │   │   ├── Deployments.tsx       # 工作负载 (伸缩/重启/删除)
│   │   │   ├── Services.tsx          # Service 列表
│   │   │   ├── Nodes.tsx            # 节点列表
│   │   │   ├── Namespaces.tsx       # 命名空间管理
│   │   │   ├── Events.tsx           # 事件流
│   │   │   └── Clusters.tsx         # 多集群接入管理
│   │   ├── store/app.ts             # 全局状态 (命名空间/集群)
│   │   ├── types/index.ts           # TypeScript 类型定义
│   │   ├── App.tsx                  # 路由配置
│   │   └── main.tsx                 # 入口 + 国际化
│   ├── vite.config.ts               # Vite 配置 (dev proxy)
│   ├── tsconfig.json
│   └── package.json
└── README.md
```

---

## API 参考

所有接口前缀 `/api/v1`，响应格式：

```json
{ "code": 0, "message": "ok", "data": {...} }
```

### 集群管理

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/clusters` | 列出所有接入集群 |
| `POST` | `/clusters` | 通过 kubeconfig 接入新集群 |
| `PUT` | `/clusters/:id/active` | 切换激活集群 |
| `DELETE` | `/clusters/:id` | 移除集群 |
| `GET` | `/clusters/status` | 集群连接状态 |

### 命名空间

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/namespaces` | 列表 |
| `POST` | `/namespaces` | 创建 (body: `{name, labels}`) |
| `DELETE` | `/namespaces/:name` | 删除 |

### 节点

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/nodes` | 列表 (角色/版本/状态) |
| `GET` | `/nodes/:name` | 详情 |

### Pod

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/pods?namespace=` | 列表 (支持 label/fieldSelector) |
| `GET` | `/namespaces/:ns/pods/:name` | 详情 |
| `DELETE` | `/namespaces/:ns/pods/:name` | 删除 |
| `GET` | `/namespaces/:ns/pods/:name/logs` | 日志 (SSE, `?follow=true`) |
| `GET` | `/namespaces/:ns/pods/:name/exec` | 终端 (WebSocket, `?command=/bin/sh`) |

### Deployment

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/deployments?namespace=` | 列表 |
| `GET` | `/namespaces/:ns/deployments/:name` | 详情 |
| `POST` | `/namespaces/:ns/deployments` | 创建 |
| `PUT` | `/namespaces/:ns/deployments/:name` | 全量更新 |
| `DELETE` | `/namespaces/:ns/deployments/:name` | 删除 |
| `PUT` | `/namespaces/:ns/deployments/:name/scale?replicas=N` | 弹性伸缩 |
| `PUT` | `/namespaces/:ns/deployments/:name/restart` | 滚动重启 |

### Service

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/services?namespace=` | 列表 |
| `GET` | `/namespaces/:ns/services/:name` | 详情 |
| `POST` | `/namespaces/:ns/services` | 创建 |
| `DELETE` | `/namespaces/:ns/services/:name` | 删除 |

### 事件 & 指标

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/events?namespace=&type=` | 事件列表 |
| `GET` | `/metrics/cluster` | 集群总览 (节点/Pod 数量 + CPU/内存) |
| `GET` | `/metrics/nodes` | 节点资源指标 |
| `GET` | `/metrics/pods?namespace=` | Pod 资源指标 |

---

## 快速上手

### 前置条件

- **Go 1.21+** — [下载](https://go.dev/dl/)
- **Node.js 18+ / npm** — [下载](https://nodejs.org/)
- 至少一个可访问的 **Kubernetes 集群** 及其 **kubeconfig**
- 资源监控图表需要集群安装 [Metrics Server](https://github.com/kubernetes-sigs/metrics-server)

### 1. 启动后端

```powershell
cd backend
go mod tidy
go run ./cmd/server/main.go

# 输出: [server] K8S 容器管理平台启动，监听 :8080
```

> 若服务运行在集群内 Pod 中，会自动检测并接入当前集群。

### 2. 启动前端

```powershell
cd frontend
npm install
npm run dev

# 输出: Local: http://localhost:3000/
```

> Vite 已配置代理：`/api/*` → `http://localhost:8080`，前端请求自动转发到后端。

### 3. 接入集群

1. 浏览器打开 `http://localhost:3000`
2. 顶部 Header 显示「未连接集群」
3. 左侧菜单 → **集群管理** → **接入集群**
4. 填写名称，粘贴 kubeconfig：

   ```powershell
   kubectl config view --raw --minify
   ```

5. 接入成功后即可：
   - 顶部下拉切换集群
   - 顶部下拉选择命名空间过滤
   - Dashboard 查看实时 CPU/内存仪表盘
   - 浏览 Pod / 工作负载 / Service / 事件

---

## 部署到 Kubernetes (In-Cluster)

将后端打包为镜像部署到集群内，配合 ServiceAccount 即可自动接入。

### 1. 构建后端 Docker 镜像

```dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY . .
RUN go mod tidy && CGO_ENABLED=0 go build -o /k8s-platform ./cmd/server

FROM alpine:3.19
COPY --from=builder /k8s-platform /k8s-platform
EXPOSE 8080
ENTRYPOINT ["/k8s-platform"]
```

```powershell
docker build -t your-registry/k8s-platform:latest .
docker push your-registry/k8s-platform:latest
```

### 2. 部署到集群

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
---
apiVersion: v1
kind: Service
metadata:
  name: k8s-platform
  namespace: kube-system
spec:
  type: NodePort
  ports:
    - port: 8080
      nodePort: 30080
  selector:
    app: k8s-platform
```

### 3. 前端静态部署

```powershell
cd frontend
npm run build
# 产出 dist/ 目录，可部署到 Nginx/CDN
```

Nginx 反向代理配置示例：

```nginx
server {
    listen 80;
    server_name k8s.example.com;

    root /usr/share/nginx/k8s-platform;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://k8s-platform.kube-system.svc:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 项目截图说明

| 页面 | 组件 | 说明 |
|---|---|---|
| **Dashboard** | ECharts Gauge · Pie · AntD Statistic | 实时 CPU/内存仪表盘 · 节点角色分布 · Pod/节点计数 |
| **Pod 列表** | AntD Table · Search · Tag | 状态标签 · 重启次数高亮 · 5s 轮询 |
| **Pod 详情** | Segmented · xterm.js · Monaco · SSE | 四标签页切换：日志 / 终端 / JSON / 容器信息 |
| **工作负载** | Modal · InputNumber | 一键伸缩 (弹出副本数) · 滚动重启 |
| **Service** | Tag (多端口) | 协议/端口/NodePort 可视化 |
| **事件** | Select (类型过滤) · Search | 实时事件流 · 按原因/对象/消息搜索 |
| **集群管理** | Modal · TextArea | kubeconfig 粘贴接入 · 切换 · 移除 |

---

## 待扩展特性

以下 K8S 特性可在当前架构基础上继续扩展：

- **工作负载**: StatefulSet / DaemonSet / Job / CronJob / ReplicaSet
- **网络**: Ingress / NetworkPolicy (可视化拓扑) / Gateway API
- **存储**: PV / PVC / StorageClass / VolumeSnapshot
- **配置**: ConfigMap / Secret (在线编辑)
- **安全**: RBAC 权限矩阵视图 / PodSecurityAdmission
- **策略**: LimitRange / ResourceQuota / PriorityClass / PDB
- **自动扩缩容**: HPA 指标驱动曲线 / VPA / Cluster Autoscaler
- **扩展**: CRD 通用管理 · Helm Chart 应用商店 · Operator
- **平台化**: 用户认证 (JWT) · 审计日志 · 告警通知 (钉钉/企微) · 多租户