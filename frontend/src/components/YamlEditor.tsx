import { useRef } from 'react'
import Editor from '@monaco-editor/react'

interface Props {
  value: string
  onChange?: (v: string) => void
  readOnly?: boolean
  height?: number | string
}

// 基于 Monaco 的 YAML 编辑器
export default function YamlEditor({ value, onChange, readOnly = false, height = 400 }: Props) {
  const editorRef = useRef<any>(null)
  return (
    <Editor
      height={height}
      language="yaml"
      theme="vs-dark"
      value={value}
      onMount={(editor) => (editorRef.current = editor)}
      onChange={(v) => onChange?.(v ?? '')}
      options={{
        readOnly,
        minimap: { enabled: false },
        fontSize: 13,
        automaticLayout: true,
        scrollBeyondLastLine: false,
      }}
    />
  )
}
