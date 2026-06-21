import client from './client'

export const api = {
  // 集群
  clusters: () => client.get('/clusters'),
  addCluster: (data: { name: string; kubeconfig: string }) => client.post('/clusters', data),
  switchCluster: (id: string) => client.put(`/clusters/${id}/active`),
  removeCluster: (id: string) => client.delete(`/clusters/${id}`),
  clusterStatus: () => client.get('/clusters/status'),

  // Namespace
  namespaces: () => client.get('/namespaces'),
  createNamespace: (data: any) => client.post('/namespaces', data),
  deleteNamespace: (name: string) => client.delete(`/namespaces/${name}`),

  // Node
  nodes: () => client.get('/nodes'),
  nodeDetail: (name: string) => client.get(`/nodes/${name}`),

  // Pod
  pods: (ns = '') => client.get('/pods', { params: { namespace: ns } }),
  podDetail: (ns: string, name: string) => client.get(`/namespaces/${ns}/pods/${name}`),
  deletePod: (ns: string, name: string) => client.delete(`/namespaces/${ns}/pods/${name}`),

  // Deployment
  deployments: (ns = '') => client.get('/deployments', { params: { namespace: ns } }),
  deploymentDetail: (ns: string, name: string) => client.get(`/namespaces/${ns}/deployments/${name}`),
  createDeployment: (ns: string, data: any) => client.post(`/namespaces/${ns}/deployments`, data),
  updateDeployment: (ns: string, name: string, data: any) => client.put(`/namespaces/${ns}/deployments/${name}`, data),
  deleteDeployment: (ns: string, name: string) => client.delete(`/namespaces/${ns}/deployments/${name}`),
  scaleDeployment: (ns: string, name: string, replicas: number) =>
    client.put(`/namespaces/${ns}/deployments/${name}/scale`, null, { params: { replicas } }),
  restartDeployment: (ns: string, name: string) => client.put(`/namespaces/${ns}/deployments/${name}/restart`),

  // Service
  services: (ns = '') => client.get('/services', { params: { namespace: ns } }),
  serviceDetail: (ns: string, name: string) => client.get(`/namespaces/${ns}/services/${name}`),
  createService: (ns: string, data: any) => client.post(`/namespaces/${ns}/services`, data),
  deleteService: (ns: string, name: string) => client.delete(`/namespaces/${ns}/services/${name}`),

  // Event
  events: (ns = '') => client.get('/events', { params: { namespace: ns } }),

  // Metrics
  clusterOverview: () => client.get('/metrics/cluster'),
  nodeMetrics: () => client.get('/metrics/nodes'),
  podMetrics: (ns = '') => client.get('/metrics/pods', { params: { namespace: ns } }),
}

// 构造日志 SSE URL
export const logUrl = (ns: string, name: string, container = '', follow = false, tail = 1000) =>
  `/api/v1/namespaces/${ns}/pods/${name}/logs?container=${container}&follow=${follow}&tailLines=${tail}`

// 构造 exec WebSocket URL
export const execWsUrl = (ns: string, name: string, container = '') => {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws'
  const cmd = encodeURIComponent('/bin/sh')
  return `${proto}://${location.host}/api/v1/namespaces/${ns}/pods/${name}/exec?container=${container}&command=${cmd}`
}
