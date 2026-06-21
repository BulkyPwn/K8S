import { useEffect, useState } from 'react'
import { Button, Input, Space, Table, Tag } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { api } from '../api/resources'
import type { Node } from '../types'

export default function Nodes() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.nodes()
      setNodes((res as any).items)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 10000)
    return () => clearInterval(t)
  }, [])

  const filtered = nodes.filter((n) => n.name.includes(keyword))

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Input.Search placeholder="搜索节点名" style={{ width: 300 }} value={keyword} onChange={(e) => setKeyword(e.target.value)} allowClear />
        <Button icon={<ReloadOutlined />} onClick={load}>刷新</Button>
      </Space>
      <Table
        rowKey="name"
        loading={loading}
        dataSource={filtered}
        size="small"
        pagination={false}
        columns={[
          { title: '节点名', dataIndex: 'name' },
          { title: '状态', dataIndex: 'status', width: 100, render: (v) => <Tag color={v === 'Ready' ? 'green' : 'red'}>{v}</Tag> },
          { title: '角色', dataIndex: 'role', width: 120, render: (v) => <Tag color={v === 'worker' ? 'blue' : 'purple'}>{v}</Tag> },
          { title: '版本', dataIndex: 'version', width: 120 },
          { title: '操作系统', dataIndex: 'os', width: 90 },
          { title: '架构', dataIndex: 'arch', width: 90 },
          { title: '内网 IP', dataIndex: 'ip', width: 140 },
          { title: '创建时间', dataIndex: 'age', width: 170 },
        ]}
      />
    </div>
  )
}
