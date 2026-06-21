import { useEffect, useState } from 'react'
import { Button, Input, InputNumber, Modal, Popconfirm, Space, Table, Tag, message } from 'antd'
import { DeleteOutlined, ReloadOutlined, ReloadOutlined as Restart, ColumnHeightOutlined } from '@ant-design/icons'
import { api } from '../api/resources'
import { useAppStore } from '../store/app'
import type { Deployment } from '../types'

export default function Deployments() {
  const { namespace } = useAppStore()
  const [deps, setDeps] = useState<Deployment[]>([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [scaleTarget, setScaleTarget] = useState<Deployment | null>(null)
  const [replicas, setReplicas] = useState(1)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.deployments(namespace)
      setDeps((res as any).items)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 5000)
    return () => clearInterval(t)
  }, [namespace])

  const handleDelete = async (d: Deployment) => {
    await api.deleteDeployment(d.namespace, d.name)
    message.success('删除成功')
    load()
  }

  const handleRestart = async (d: Deployment) => {
    await api.restartDeployment(d.namespace, d.name)
    message.success('已触发重启')
    load()
  }

  const openScale = (d: Deployment) => {
    setScaleTarget(d)
    setReplicas(parseInt(d.ready.split('/')[1]) || 1)
  }

  const doScale = async () => {
    if (scaleTarget) {
      await api.scaleDeployment(scaleTarget.namespace, scaleTarget.name, replicas)
      message.success('已更新副本数')
      setScaleTarget(null)
      load()
    }
  }

  const filtered = deps.filter((d) => d.name.includes(keyword))

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
          { title: '就绪', dataIndex: 'ready', width: 90, render: (v) => <Tag color="blue">{v}</Tag> },
          { title: '已更新', dataIndex: 'upToDate', width: 80 },
          { title: '可用', dataIndex: 'available', width: 80 },
          { title: '镜像', dataIndex: 'images', render: (v: string[]) => v.map((i) => <Tag key={i}>{i}</Tag>) },
          { title: '创建时间', dataIndex: 'age', width: 170 },
          {
            title: '操作', width: 280, render: (_, r) => (
              <Space>
                <Button size="small" icon={<ColumnHeightOutlined />} onClick={() => openScale(r)}>伸缩</Button>
                <Popconfirm title={`重启 ${r.name}？`} onConfirm={() => handleRestart(r)}>
                  <Button size="small" icon={<Restart />}>重启</Button>
                </Popconfirm>
                <Popconfirm title={`删除 ${r.name}？`} onConfirm={() => handleDelete(r)}>
                  <Button danger size="small" icon={<DeleteOutlined />}>删除</Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title={scaleTarget ? `伸缩 ${scaleTarget.name}` : ''}
        open={!!scaleTarget}
        onOk={doScale}
        onCancel={() => setScaleTarget(null)}
      >
        <div style={{ textAlign: 'center', padding: 20 }}>
          <span style={{ marginRight: 12 }}>目标副本数：</span>
          <InputNumber min={0} max={100} value={replicas} onChange={(v) => setReplicas(v || 0)} style={{ width: 120 }} />
        </div>
      </Modal>
    </div>
  )
}
