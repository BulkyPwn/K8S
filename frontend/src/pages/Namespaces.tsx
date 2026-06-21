import { useEffect, useState } from 'react'
import { Button, Form, Input, Modal, Popconfirm, Space, Table, Tag, message } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { api } from '../api/resources'
import type { Namespace } from '../types'

export default function Namespaces() {
  const [nss, setNss] = useState<Namespace[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.namespaces()
      setNss((res as any).items)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreate = async () => {
    const v = await form.validateFields()
    await api.createNamespace(v)
    message.success('创建成功')
    setOpen(false)
    form.resetFields()
    load()
  }

  const handleDelete = async (ns: Namespace) => {
    await api.deleteNamespace(ns.name)
    message.success('删除成功')
    load()
  }

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 16, fontWeight: 500 }}>命名空间列表</span>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={load}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>新建</Button>
        </Space>
      </Space>
      <Table
        rowKey="name"
        loading={loading}
        dataSource={nss}
        size="small"
        pagination={false}
        columns={[
          { title: '名称', dataIndex: 'name' },
          { title: '状态', dataIndex: 'status', width: 120, render: (v) => <Tag color={v === 'Active' ? 'green' : 'red'}>{v}</Tag> },
          { title: '创建时间', dataIndex: 'age', width: 200 },
          {
            title: '操作', width: 120, render: (_, r) => (
              <Popconfirm title={`删除命名空间 ${r.name}？该操作不可恢复`} onConfirm={() => handleDelete(r)} okButtonProps={{ danger: true }}>
                <Button danger size="small">删除</Button>
              </Popconfirm>
            ),
          },
        ]}
      />

      <Modal title="新建命名空间" open={open} onOk={handleCreate} onCancel={() => setOpen(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="如：my-app" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
