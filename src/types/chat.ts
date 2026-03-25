export type MessageRole = 'user' | 'assistant'

export interface ChatMessage {
  id:                  string
  role:                MessageRole
  content:             string
  timestamp:           string
  appConfigSnapshot?:  import('./AppConfig').AppConfig  // assistant 消息生成配置时附带
}