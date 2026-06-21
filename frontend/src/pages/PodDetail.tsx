import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Descriptions, Segmented, Spin, Tag, Typography } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { api, execWsUrl } from '../api/resources'
import YamlEditor from '../components/YamlEditor'
import LogViewer from '../components/LogViewer'
import Terminal from '../components/Terminal'

const { Title } = Typography

export default function PodDetail() {
  const { namespace, name } = useParams()
  const navigate = useNavigate()
  const [pod, setPod] = useState<any>(null)
  const [yaml, setYaml] = useState('')
  const [tab, setTab] = useState<string>('logs')

  const load = async () => {
    if (!namespace || !name) return
    const res: any = await api.podDetail(namespace, name)
    setPod(res)
    // 简易序列化为类 YAML 文本
    setYaml(JSON.stringify(res, null, 2))
  }

  useEffect(() => {
    load()
  }, [namespace, name])

  if (!pod) return <Spin />

  const containers = (pod.spec?.containers || []).map((c: any) => c.name)

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/pods')} style={{ marginBottom: 12 }}>返回</Button>
      <Title level={4}>
        {name} <Tag color="blue">{pod.status?.phase}</Tag>
      </Title>

      <Descriptions size="small" column={3} bordered style={{ marginBottom: 16 }}>
        <Descriptions.Item label="命名空间">{pod.metadata?.namespace}</Descriptions.Item>
        <Descriptions.Item label="节点">{pod.spec?.nodeName}</Descriptions.Item>
        <Descriptions.Item label="Pod IP">{pod.status?.podIP}</Descriptions.Item>
        <Descriptions.Item label="主机 IP">{pod.status?.hostIP}</Descriptions.Item>
        <Descriptions.Item label="重启策略">{pod.spec?.restartPolicy}</Descriptions.Item>
        <Descriptions.Item label="服务账号">{pod.spec?.serviceAccountName}</Descriptions.Item>
        <Descriptions.Item label="QoS">{pod.status?.qosClass}</Descriptions.Item>
        <Descriptions.Item label="创建时间">{pod.metadata?.creationTimestamp}</Descriptions.Item>
        <Descriptions.Item label="UID">{pod.metadata?.uid}</Descriptions.Item>
      </Descriptions>

      <Segmented
        options={[
          { label: '日志', value: 'logs' },
          { label: '终端', value: 'terminal' },
          { label: 'JSON', value: 'yaml' },
          { label: '容器', value: 'containers' },
        ]}
        value={tab}
        onChange={(v) => setTab(v as string)}
        style={{ marginBottom: 12 }}
      />

      <div>
        {tab === 'logs' && namespace && name && (
          <LogViewer namespace={namespace} pod={name} containers={containers} />
        )}
        {tab === 'terminal' && namespace && name && (
          <div className="terminal-box" style={{ height: 460 }}>
            <Terminal url={execWsUrl(namespace, name, containers[0] || '')} />
          </div>
        )}
        {tab === 'yaml' && <YamlEditor value={yaml} readOnly height={460} />}
        {tab === 'containers' && (
          <Descriptions column={1} bordered size="small">
            {(pod.spec?.containers || []).map((c: any) => (
              <Descriptions.Item key={c.name} label={c.name}>
                <div>镜像：{c.image}</div>
                <div>端口：{(c.ports || []).map((p: any) => `${p.containerPort}/${p.protocol}`).join(', ') || '无'}</div>
                <div>命令：{(c.command || []).join(' ') || '默认'}</div>
                <div>资源：{JSON.stringify(c.resources?.requests || {})} → {JSON.stringify(c.resources?.limits || {})}</div>
              </Descriptions.Item>
            ))}
          </Descriptions>
        )}
      </div>
    </div>
  )
}
