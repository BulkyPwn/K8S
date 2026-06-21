export interface ApiResult<T = any> {
  code: number
  message: string
  data?: T
}

export interface ListResult<T = any> {
  total: number
  items: T[]
}

export interface Pod {
  name: string
  namespace: string
  status: string
  podIP: string
  node: string
  restarts: number
  ready: string
  age: string
  labels: Record<string, string>
  containers: Container[]
}

export interface Container {
  name: string
  image: string
  ready: boolean
  restarts: number
  state: string
}

export interface Deployment {
  name: string
  namespace: string
  ready: string
  upToDate: number
  available: number
  age: string
  images: string[]
  labels: Record<string, string>
}

export interface Service {
  name: string
  namespace: string
  type: string
  clusterIP: string
  externalIP: string
  ports: any[]
  age: string
  selector: Record<string, string>
}

export interface Node {
  name: string
  status: string
  role: string
  version: string
  os: string
  arch: string
  ip: string
  age: string
  labels: Record<string, string>
}

export interface Namespace {
  name: string
  status: string
  age: string
  labels: Record<string, string>
}

export interface K8sEvent {
  name: string
  namespace: string
  type: string
  reason: string
  message: string
  kind: string
  object: string
  count: number
  lastTime: string
}

export interface Cluster {
  id: string
  name: string
  server: string
  mode: string
  inCluster: boolean
  active: boolean
}

export interface ClusterOverview {
  nodeCount: number
  podCount: number
  runningPods: number
  totalCPU: number
  usedCPU: number
  totalMemory: number
  usedMemory: number
}
