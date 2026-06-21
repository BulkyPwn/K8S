import { useEffect, useRef } from 'react'
import { Terminal as XTerm } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'

interface Props {
  url: string // exec websocket url
}

// Web 终端：xterm.js + WebSocket 连接后端 exec
export default function Terminal({ url }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<XTerm | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const term = new XTerm({
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      cursorBlink: true,
    })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(containerRef.current)
    fit.fit()
    termRef.current = term
    term.writeln('\x1b[36m正在连接到容器...\x1b[0m\r')

    const ws = new WebSocket(url)
    const input = (data: string) => {
      // 首字节 0 表示输入
      const buf = new Uint8Array(data.length + 1)
      buf[0] = 0
      for (let i = 0; i < data.length; i++) buf[i + 1] = data.charCodeAt(i)
      if (ws.readyState === WebSocket.OPEN) ws.send(buf)
    }

    term.onData((data) => input(data))

    // resize 上报
    const resize = () => {
      fit.fit()
      const w = term.cols, h = term.rows
      const buf = new Uint8Array(5)
      buf[0] = 1
      buf[1] = (w >> 8) & 0xff
      buf[2] = w & 0xff
      buf[3] = (h >> 8) & 0xff
      buf[4] = h & 0xff
      if (ws.readyState === WebSocket.OPEN) ws.send(buf)
    }
    const onResize = term.onResize(resize)
    window.addEventListener('resize', resize)

    ws.binaryType = 'arraybuffer'
    ws.onopen = () => {
      term.clear()
      resize()
    }
    ws.onmessage = (ev) => {
      const data = ev.data instanceof ArrayBuffer ? new Uint8Array(ev.data) : ev.data
      if (typeof data === 'string') term.write(data)
      else term.write(new TextDecoder().decode(data))
    }
    ws.onerror = () => term.writeln('\r\n\x1b[31m连接错误\x1b[0m')
    ws.onclose = () => term.writeln('\r\n\x1b[33m连接已关闭\x1b[0m')

    return () => {
      ws.close()
      onResize.dispose()
      window.removeEventListener('resize', resize)
      term.dispose()
    }
  }, [url])

  return <div ref={containerRef} style={{ height: '100%', background: '#000' }} />
}
