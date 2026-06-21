import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Popconfirm, Space, Table, Tag, message } from 'antd'
import { DeleteOutlined, ReloadOutlined } from '@ant-design/icons'
import { api } from '../api/resources'
import { useAppStore } from '../store/app'
import type { Pod } from '../types'

const statusColor: Record<string, string> = {
  Running: 'green',
  Pending: 'orange',
  Failed: 'red',
  Succeeded: 'blue',
  Unknown: 'default',
}

export default function Pods() {
  const navigate = useNavigate()
  const { namespace } = useAppStore()
  const [pods, setPods] = useState<Pod[]>([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.pods(namespace)
      setPods((res as any).items)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 5000)
    return () => clearInterval(t)
  }, [namespace])

  const handleDelete = async (pod: Pod) => {
    await api.deletePod(pod.namespace, pod.name)
    message.success('删除成功')
    load()
  }

  const filtered = pods.filter((p) => p.name.includes(keyword) || p.namespace.includes(keyword))

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Input.Search placeholder="搜索 Pod 名称/命名空间" style={{ width: 300 }} value={keyword} onChange={(e) => setKeyword(e.target.value)} allowClear />
        <Button icon={<ReloadOutlined />} onClick={load}>刷新</Button>
      </Space>
      <Table
        rowKey={(r) => r.namespace + '/' + r.name}
        loading={loading}
        dataSource={filtered}
        size="small"
        pagination={{ pageSize: 20, showSizeChanger: true }}
        columns={[
          { title: '名称', dataIndex: 'name', render: (v, r) => <a onClick={() => navigate(`/namespaces/${r.namespace}/pods/${r.name}`)}>{v}</a> },
          { title: '命名空间', dataIndex: 'namespace', width: 140 },
          { title: '状态', dataIndex: 'status', width: 100, render: (v) => <Tag color={statusColor[v] || 'default'}>{v}</Tag> },
          { title: '就绪', dataIndex: 'ready', width: 80 },
          { title: '重启次数', dataIndex: 'restarts', width: 90, render: (v) => (v > 0 ? <span style={{ color: 'red' }}>{v}</span> : v) },
          { title: '节点', dataIndex: 'node', width: 160 },
          { title: 'Pod IP', dataIndex: 'podIP', width: 140 },
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
