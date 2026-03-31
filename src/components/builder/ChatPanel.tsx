import { useState, useRef, useEffect } from 'react'
import { Input, Button, Typography, Spin } from 'antd'
import { SendOutlined } from '@ant-design/icons'
import type { ChatMessage } from '../../types/chat'

const { Text } = Typography

export interface QuickPromptItem {
  label: string
  prompt: string
}

interface Props {
  messages: ChatMessage[]
  loading: boolean
  onSend: (content: string) => void
  waitingForPassword?: boolean
  quickPrompts?: QuickPromptItem[]
}

export default function ChatPanel({
  messages,
  loading,
  onSend,
  waitingForPassword,
  quickPrompts,
}: Props) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSend() {
    const text = input.trim()
    if (!text || loading) return
    onSend(text)
    setInput('')
  }

  const showQuick = quickPrompts?.length && !waitingForPassword && !loading

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
      role="region"
      aria-label="AI 生成对话"
    >

      <div
        id="builder-chat-log"
        style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-busy={loading}
      >
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: 48, paddingLeft: 16, paddingRight: 16 }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
              用自然语言说明要记录什么、要哪些页面或流程——AI 据此生成配置，可随时迭代改稿。
            </Text>
            <Text type="secondary" style={{ fontSize: 13 }}>
              不必先选模板；需要常见实验字段联想时点顶栏「领域参考」即可。
            </Text>
          </div>
        )}

        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {loading && (
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0' }}
            aria-live="polite"
          >
            <Spin size="small" aria-hidden />
            <Text type="secondary">正在生成...</Text>
          </div>
        )}

        <div ref={bottomRef} aria-hidden />
      </div>

      {showQuick && (
        <div
          style={{
            padding: '8px 24px 0',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            borderTop: '1px solid #f0f0f0',
          }}
          role="group"
          aria-label="快捷修改话术"
        >
          {quickPrompts!.map(q => (
            <Button
              key={q.label}
              size="small"
              type="default"
              disabled={loading}
              onClick={() => onSend(q.prompt)}
            >
              {q.label}
            </Button>
          ))}
        </div>
      )}

      <div
        style={{
          padding: '12px 24px',
          borderTop: '1px solid #f0f0f0',
          display: 'flex',
          gap: 8,
        }}
        role="group"
        aria-label="发送消息"
      >
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onPressEnter={handleSend}
          placeholder="描述你的需求，例如：我需要记录 HeLa 细胞的传代数据"
          disabled={loading}
          aria-label={
            loading
              ? '输入需求（生成中已禁用）'
              : '输入对 AI 的需求或修改说明，回车发送'
          }
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          disabled={loading || !input.trim()}
          aria-label="发送消息"
        >
          发送
        </Button>
      </div>

    </div>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 12,
      }}
    >
      <div
        aria-label={isUser ? '你说' : 'AI 回复'}
        style={{
          maxWidth: '75%',
          padding: '10px 14px',
          borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
          background: isUser ? '#4F46E5' : '#F3F4F6',
          color: isUser ? '#fff' : '#111',
          fontSize: 14,
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
        }}
      >
        {message.content}
      </div>
    </div>
  )
}
