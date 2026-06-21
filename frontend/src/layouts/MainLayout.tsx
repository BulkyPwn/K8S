import { useEffect, useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Select, Space, Tag, Typography } from 'antd'
import {
  DashboardOutlined,
  BoxPlotOutlined,
  DeploymentUnitOutlined,
  ClusterOutlined,
  ApartmentOutlined,
  CloudServerOutlined,
  AlertOutlined,
  DatabaseOutlined,
} from '@ant-design/icons'
import { api } from '../api/resources'
import { useAppStore } from '../store/app'
import type { Cluster } from '../types'

const { Header, Sider, Content } = Layout
const { Title } = Typography

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '集群总览' },
  { key: '/nodes', icon: <ApartmentOutlined />, label: '节点' },
  { key: '/namespaces', icon: <CloudServerOutlined />, label: '命名空间' },
  { key: '/pods', icon: <BoxPlotOutlined />, label: 'Pod' },
  { key: '/deployments', icon: <DeploymentUnitOutlined />, label: '工作负载' },
  { key: '/services', icon: <DatabaseOutlined />, label: '服务' },
  { key: '/events', icon: <AlertOutlined />, label: '事件' },
  { key: '/clusters', icon: <ClusterOutlined />, label: '集群管理' },
]

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { namespace, setNamespace } = useAppStore()
  const [namespaces, setNamespaces] = useState<string[]>([])
  const [clusters, setClusters] = useState<Cluster[]>([])

  const loadData = async () => {
    try {
      const [ns, cs] = await Promise.all([api.namespaces(), api.clusters()])
      setNamespaces((ns as any).items.map((n: any) => n.name))
      setClusters(cs as any)
    } catch {
      // 集群未就绪
    }
  }

  useEffect(() => {
    loadData()
  }, [namespace])

  const switchCluster = async (id: string) => {
    await api.switchCluster(id)
    loadData()
  }

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider width={220} theme="dark">
        <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          <Title level={4} style={{ color: '#fff', margin: 0 }}>
            ☸ K8S 平台
          </Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Space>
            <span>命名空间：</span>
            <Select
              style={{ width: 180 }}
              value={namespace}
              onChange={setNamespace}
              options={[{ label: '全部 (All)', value: '' }, ...namespaces.map((n) => ({ label: n, value: n }))]}
            />
          </Space>
          <Space>
            {clusters.length > 0 && (
              <Select
                style={{ width: 200 }}
                value={clusters.find((c) => c.active)?.id}
                onChange={switchCluster}
                options={clusters.map((c) => ({ label: `${c.name} ${c.active ? '(当前)' : ''}`, value: c.id }))}
              />
            )}
            <Tag color={clusters.length > 0 ? 'green' : 'red'}>
              {clusters.length > 0 ? '已连接' : '未连接集群'}
            </Tag>
          </Space>
        </Header>
        <Content style={{ margin: 16, padding: 24, background: '#fff', borderRadius: 8, overflow: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
