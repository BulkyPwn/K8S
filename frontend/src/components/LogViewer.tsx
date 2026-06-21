import { useEffect, useRef, useState } from 'react'
import { Button, Input, Select, Space, Switch } from 'antd'
import { ClearOutlined, DownloadOutlined } from '@ant-design/icons'
import { logUrl } from '../api/resources'

interface Props {
  namespace: string
  pod: string
  containers: string[]
}

// Pod 日志查看器（SSE 实时流）
export default function LogViewer({ namespace, pod, containers }: Props) {
  const [container, setContainer] = useState(containers[0] || '')
  const [follow, setFollow] = useState(true)
  const [lines, setLines] = useState<string[]>([])
  const [keyword, setKeyword] = useState('')
  const boxRef = useRef<HTMLPreElement>(null)
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    setLines([])
    // 关闭旧连接
    esRef.current?.close()
    if (!container) return

    const url = logUrl(namespace, pod, container, follow, 1000)
    if (follow) {
      const es = new EventSource(url)
      esRef.current = es
      es.onmessage = (e) => setLines((prev) => [...prev, e.data])
      es.onerror = () => es.close()
      return () => es.close()
    } else {
      // 一次性拉取
      fetch(url)
        .then((r) => r.text())
        .then((t) => setLines(t.split('\n')))
      return
    }
  }, [namespace, pod, container, follow])

  // 自动滚动到底部
  useEffect(() => {
    if (boxRef.current && follow) boxRef.current.scrollTop = boxRef.current.scrollHeight
  }, [lines, follow])

  const filtered = keyword ? lines.filter((l) => l.includes(keyword)) : lines
  const exportLog = () => {
    const blob = new Blob([filtered.join('\n')], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${pod}-${container}.log`
    a.click()
  }

  return (
    <div>
      <Space style={{ marginBottom: 8, width: '100%', justifyContent: 'space-between' }}>
        <Space>
          <Select
            style={{ width: 180 }}
            value={container}
            onChange={setContainer}
            options={containers.map((c) => ({ label: c, value: c }))}
          />
          <span>实时跟随</span>
          <Switch checked={follow} onChange={setFollow} />
        </Space>
        <Space>
          <Input.Search placeholder="过滤关键字" value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 200 }} allowClear />
          <Button icon={<ClearOutlined />} onClick={() => setLines([])}>清空</Button>
          <Button icon={<DownloadOutlined />} onClick={exportLog}>导出</Button>
        </Space>
      </Space>
      <pre
        ref={boxRef}
        style={{
          background: '#1e1e1e', color: '#d4d4d4', padding: 12, height: 420,
          overflow: 'auto', borderRadius: 4, fontSize: 12, fontFamily: 'Menlo, monospace',
        }}
      >
        {filtered.join('\n') || '（暂无日志）'}
      </pre>
    </div>
  )
}
