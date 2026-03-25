import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import type { ChatMessage } from '../types/chat'
import type { AppConfig } from '../types/AppConfig'

interface BuilderState {
  messages: ChatMessage[]
  currentConfig: AppConfig | null
  status: 'idle' | 'generating' | 'done' | 'error'
  errorMsg: string

  addUserMessage:              (content: string) => ChatMessage
  addAssistantMessage:         (content: string, config?: AppConfig) => ChatMessage
  updateLastAssistantContent:  (delta: string) => void
  setCurrentConfig:            (config: AppConfig | null) => void
  setStatus:                   (status: BuilderState['status'], errorMsg?: string) => void
  reset:                       () => void
}

const INITIAL_STATE = {
  messages:      [] as ChatMessage[],
  currentConfig: null,
  status:        'idle' as const,
  errorMsg:      '',
}

export const useBuilderStore = create<BuilderState>((set) => ({
  ...INITIAL_STATE,

  addUserMessage(content) {
    const msg: ChatMessage = {
      id:        uuid(),
      role:      'user',
      content,
      timestamp: new Date().toISOString(),
    }
    set(s => ({ messages: [...s.messages, msg] }))
    return msg
  },

  addAssistantMessage(content, config) {
    const msg: ChatMessage = {
      id:        uuid(),
      role:      'assistant',
      content,
      timestamp: new Date().toISOString(),
      appConfigSnapshot: config,
    }
    set(s => ({ messages: [...s.messages, msg] }))
    return msg
  },

  // 流式输出时逐块追加内容到最后一条 assistant 消息
  updateLastAssistantContent(delta) {
    set(s => {
      const msgs = [...s.messages]
      const last = msgs[msgs.length - 1]
      if (last?.role === 'assistant') {
        msgs[msgs.length - 1] = { ...last, content: last.content + delta }
      }
      return { messages: msgs }
    })
  },

  setCurrentConfig(config) {
    set({ currentConfig: config })
  },

  setStatus(status, errorMsg = '') {
    set({ status, errorMsg })
  },

  // 离开生成器页面时重置，避免状态污染下一次创建
  reset() {
    set(INITIAL_STATE)
  },
}))