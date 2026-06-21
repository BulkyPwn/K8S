import { useEffect, useState } from 'react'
import { Alert, Button, Card, Form, Input, Modal, Popconfirm, Space, Table, Tag, Typography, message } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { api } from '../api/resources'
import type { Cluster } from '../types'

const { Title, Paragraph } = Typography

export default function Clusters() {
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.clusters()
      setClusters(res as any)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleAdd = async () => {
    const v = await form.validateFields()
    await api.addCluster(v)
    message.success('接入成功')
    setOpen(false)
    form.resetFields()
    load()
  }

  const handleSwitch = async (c: Cluster) => {
    await api.switchCluster(c.id)
    message.success(`已切换到 ${c.name}`)
    load()
  }

  const handleRemove = async (c: Cluster) => {
    await api.removeCluster(c.id)
    message.success('已移除')
    load()
  }

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Title level={5}>集群接入说明</Title>
        <Paragraph type="secondary">
          支持两种接入方式：
          <br />
          1. <b>In-Cluster</b>：平台以 Pod 形式部署在 K8S 中时自动接入。
          <br />
          2. <b>Kubeconfig</b>：粘贴目标集群的 kubeconfig 文件内容接入（支持多集群）。
          <br />
          获取 kubeconfig：<code>kubectl config view --raw --minify</code>
        </Paragraph>
      </Card>

      {clusters.length === 0 && (
        <Alert
          type="warning"
          message="尚未接入任何集群"
          description="点击右上角「接入集群」开始使用平台。"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Title level={4} style={{ margin: 0 }}>接入的集群</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={load}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>接入集群</Button>
        </Space>
      </Space>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={clusters}
        size="small"
        pagination={false}
        columns={[
          { title: '名称', dataIndex: 'name' },
          { title: 'ID', dataIndex: 'id', width: 160 },
          { title: 'API Server', dataIndex: 'server', width: 280 },
          { title: '接入方式', dataIndex: 'mode', width: 120, render: (v) => <Tag color={v === 'in-cluster' ? 'green' : 'blue'}>{v}</Tag> },
          {
            title: '状态', dataIndex: 'active', width: 100, render: (v) =>
              v ? <Tag color="success">当前使用</Tag> : <Tag>可用</Tag>,
          },
          {
            title: '操作', width: 220, render: (_, r) => (
              <Space>
                {!r.active && (
                  <Button size="small" type="link" onClick={() => handleSwitch(r)}>切换</Button>
                )}
                <Popconfirm title={`移除 ${r.name}？`} onConfirm={() => handleRemove(r)}>
                  <Button danger size="small" type="link">移除</Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <Modal title="接入新集群" open={open} onOk={handleAdd} onCancel={() => setOpen(false)} width={640} okText="接入">
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="集群名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="如：生产集群 / 测试集群" />
          </Form.Item>
          <Form.Item name="kubeconfig" label="Kubeconfig 内容" rules={[{ required: true, message: '请粘贴 kubeconfig' }]}>
            <Input.TextArea rows={12} placeholder="粘贴 kubectl config view --raw 的输出" style={{ fontFamily: 'monospace' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
