import { useEffect, useState } from 'react'
import { Button, Input, Popconfirm, Space, Table, Tag, message } from 'antd'
import { DeleteOutlined, ReloadOutlined } from '@ant-design/icons'
import { api } from '../api/resources'
import { useAppStore } from '../store/app'
import type { Service } from '../types'

export default function Services() {
  const { namespace } = useAppStore()
  const [svcs, setSvcs] = useState<Service[]>([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.services(namespace)
      setSvcs((res as any).items)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 5000)
    return () => clearInterval(t)
  }, [namespace])

  const handleDelete = async (s: Service) => {
    await api.deleteService(s.namespace, s.name)
    message.success('删除成功')
    load()
  }

  const filtered = svcs.filter((s) => s.name.includes(keyword))
  const typeColor: Record<string, string> = { ClusterIP: 'blue', NodePort: 'gold', LoadBalancer: 'green', ExternalName: 'purple' }

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Input.Search placeholder="搜索名称" style={{ width: 300 }} value={keyword} onChange={(e) => setKeyword(e.target.value)} allowClear />
        <Button icon={<ReloadOutlined />} onClick={load}>刷新</Button>
      </Space>
      <Table
        rowKey={(r) => r.namespace + '/' + r.name}
        loading={loading}
        dataSource={filtered}
        size="small"
        pagination={{ pageSize: 20 }}
        columns={[
          { title: '名称', dataIndex: 'name' },
          { title: '命名空间', dataIndex: 'namespace', width: 140 },
          { title: '类型', dataIndex: 'type', width: 120, render: (v) => <Tag color={typeColor[v]}>{v}</Tag> },
          { title: 'Cluster IP', dataIndex: 'clusterIP', width: 140 },
          { title: 'External IP', dataIndex: 'externalIP', width: 160 },
          {
            title: '端口', dataIndex: 'ports', render: (ports: any[]) =>
              ports.map((p, i) => (
                <Tag key={i}>
                  {p.port}:{p.targetPort}/{p.protocol}
                  {p.nodePort ? `·${p.nodePort}` : ''}
                </Tag>
              )),
          },
          { title: '创建时间', dataIndex: 'age', width: 170 },
          {
            title: '操作', width: 90, render: (_, r) => (
              <Popconfirm title={`删除 ${r.name}？`} onConfirm={() => handleDelete(r)}>
                <Button danger size="small" icon={<DeleteOutlined />}>删除</Button>
              </Popconfirm>
            ),
          },
        ]}
      />
    </div>
  )
}
