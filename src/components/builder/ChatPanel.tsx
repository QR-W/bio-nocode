import { useState, useRef, useEffect } from 'react'
import { Input, Button, Typography, Spin } from 'antd'
import { SendOutlined } from '@ant-design/icons'
import type { ChatMessage } from '../../types/chat'

const { Text } = Typography

interface Props {
  messages:   ChatMessage[]
  loading:    boolean
  onSend:     (content: string) => void
  waitingForPassword?: boolean
}

export default function ChatPanel({ messages, loading, onSend }: Props) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  // 每次消息更新自动滚到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSend() {
    const text = input.trim()
    if (!text || loading) return
    onSend(text)
    setInput('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* 消息列表 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: 60 }}>
            <Text type="secondary">描述你的实验数据管理需求，AI 会自动生成对应的表单</Text>
          </div>
        )}

        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* AI 思考中 */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0' }}>
            <Spin size="small" />
            <Text type="secondary">正在生成...</Text>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 输入区 */}
      <div style={{
        padding: '12px 24px',
        borderTop: '1px solid #f0f0f0',
        display: 'flex',
        gap: 8,
      }}>
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onPressEnter={handleSend}
          placeholder="描述你的需求，例如：我需要记录 HeLa 细胞的传代数据"
          disabled={loading}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          disabled={loading || !input.trim()}
        >
          发送
        </Button>
      </div>

    </div>
  )
}

// ─── 消息气泡 ─────────────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  return (
    <div style={{
      display:       'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom:  12,
    }}>
      <div style={{
        maxWidth:     '75%',
        padding:      '10px 14px',
        borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
        background:   isUser ? '#4F46E5' : '#F3F4F6',
        color:        isUser ? '#fff' : '#111',
        fontSize:     14,
        lineHeight:   1.6,
        whiteSpace:   'pre-wrap',
      }}>
        {message.content}
      </div>
    </div>
  )
}