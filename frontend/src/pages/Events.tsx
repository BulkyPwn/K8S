import { useEffect, useState } from 'react'
import { Button, Input, Select, Space, Table, Tag } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { api } from '../api/resources'
import { useAppStore } from '../store/app'
import type { K8sEvent } from '../types'

export default function Events() {
  const { namespace } = useAppStore()
  const [events, setEvents] = useState<K8sEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.events(namespace)
      setEvents((res as any).items)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 5000)
    return () => clearInterval(t)
  }, [namespace])

  let filtered = events
  if (keyword) filtered = filtered.filter((e) => e.message.includes(keyword) || e.object.includes(keyword) || e.reason.includes(keyword))
  if (typeFilter) filtered = filtered.filter((e) => e.type === typeFilter)

  const typeColor: Record<string, string> = { Normal: 'blue', Warning: 'orange' }

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Space>
          <Select
            style={{ width: 140 }}
            placeholder="事件类型"
            value={typeFilter || undefined}
            onChange={(v) => setTypeFilter(v || '')}
            allowClear
            options={[
              { label: '全部', value: '' },
              { label: 'Normal', value: 'Normal' },
              { label: 'Warning', value: 'Warning' },
            ]}
          />
          <Input.Search placeholder="搜索消息/对象/原因" style={{ width: 280 }} value={keyword} onChange={(e) => setKeyword(e.target.value)} allowClear />
        </Space>
        <Button icon={<ReloadOutlined />} onClick={load}>刷新</Button>
      </Space>
      <Table
        rowKey={(r) => r.name + r.lastTime}
        loading={loading}
        dataSource={filtered}
        size="small"
        pagination={{ pageSize: 50 }}
        columns={[
          { title: '类型', dataIndex: 'type', width: 90, render: (v) => <Tag color={typeColor[v] || 'default'}>{v}</Tag> },
          { title: '原因', dataIndex: 'reason', width: 160 },
          { title: '资源', width: 200, render: (_, r) => `${r.kind}/${r.object}` },
          { title: '命名空间', dataIndex: 'namespace', width: 140 },
          { title: '消息', dataIndex: 'message' },
          { title: '次数', dataIndex: 'count', width: 70 },
          { title: '最后发生', dataIndex: 'lastTime', width: 170 },
        ]}
      />
    </div>
  )
}
