import { useEffect, useState } from 'react'
import { Card, Col, Row, Statistic, Empty, Spin } from 'antd'
import {
  ApartmentOutlined,
  BoxPlotOutlined,
  CheckCircleOutlined,
  CloudServerOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { api } from '../api/resources'
import type { ClusterOverview, Node } from '../types'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<ClusterOverview | null>(null)
  const [nodes, setNodes] = useState<Node[]>([])

  const load = async () => {
    setLoading(true)
    try {
      const [ov, nd] = await Promise.all([api.clusterOverview(), api.nodes()])
      setOverview(ov as any)
      setNodes((nd as any).items)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 10000)
    return () => clearInterval(t)
  }, [])

  if (loading && !overview) return <Spin />
  if (!overview) return <Empty description="请先在「集群管理」接入一个集群" />

  const cpuPct = overview.totalCPU ? Math.round((overview.usedCPU / overview.totalCPU) * 100) : 0
  const memPct = overview.totalMemory ? Math.round((overview.usedMemory / overview.totalMemory) * 100) : 0

  const gaugeOption = (pct: number, name: string) => ({
    series: [
      {
        type: 'gauge',
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: 100,
        progress: { show: true, width: 14 },
        axisLine: { lineStyle: { width: 14 } },
        pointer: { show: false },
        detail: { valueAnimation: true, formatter: '{value}%', fontSize: 22, offsetCenter: [0, '30%'] },
        data: [{ value: pct, name }],
      },
    ],
  })

  const nodePie = {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        data: [
          { value: nodes.filter((n) => n.role === 'control-plane' || n.role === 'master').length, name: '控制节点' },
          { value: nodes.filter((n) => n.role === 'worker').length, name: '工作节点' },
        ],
      },
    ],
  }

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card><Statistic title="节点总数" value={overview.nodeCount} prefix={<ApartmentOutlined />} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="Pod 总数" value={overview.podCount} prefix={<BoxPlotOutlined />} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="运行中 Pod" value={overview.runningPods} valueStyle={{ color: '#3f8600' }} prefix={<CheckCircleOutlined />} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="命名空间数" value={nodes.length} prefix={<CloudServerOutlined />} /></Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Card title="CPU 使用率"><ReactECharts option={gaugeOption(cpuPct, 'CPU')} style={{ height: 220 }} /></Card>
        </Col>
        <Col span={8}>
          <Card title="内存使用率"><ReactECharts option={gaugeOption(memPct, '内存')} style={{ height: 220 }} /></Card>
        </Col>
        <Col span={8}>
          <Card title="节点角色分布"><ReactECharts option={nodePie} style={{ height: 220 }} /></Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="节点列表" size="small">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fafafa', textAlign: 'left' }}>
                  <th style={{ padding: 8 }}>节点名</th>
                  <th style={{ padding: 8 }}>状态</th>
                  <th style={{ padding: 8 }}>角色</th>
                  <th style={{ padding: 8 }}>版本</th>
                  <th style={{ padding: 8 }}>内网 IP</th>
                  <th style={{ padding: 8 }}>创建时间</th>
                </tr>
              </thead>
              <tbody>
                {nodes.map((n) => (
                  <tr key={n.name} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: 8 }}>{n.name}</td>
                    <td style={{ padding: 8 }}>{n.status}</td>
                    <td style={{ padding: 8 }}>{n.role}</td>
                    <td style={{ padding: 8 }}>{n.version}</td>
                    <td style={{ padding: 8 }}>{n.ip}</td>
                    <td style={{ padding: 8 }}>{n.age}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
