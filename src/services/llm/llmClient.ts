import OpenAI from 'openai'
import { useSettingsStore } from '../../stores/settingsStore'

export type LLMMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

const DEEPSEEK_DEFAULT_BASE_URL = 'https://api.deepseek.com'
export const DEEPSEEK_CHAT_MODEL = 'deepseek-chat'

function resolveBaseURL(): string {
  const fromStore = useSettingsStore.getState().baseURL?.trim()
  if (fromStore) return fromStore.replace(/\/+$/, '')
  return DEEPSEEK_DEFAULT_BASE_URL
}

function getClient(): OpenAI {
  const { apiKey } = useSettingsStore.getState()
  if (!apiKey) throw new Error('请先在设置中填写 DeepSeek API Key')

  return new OpenAI({
    apiKey,
    baseURL: resolveBaseURL(),
    dangerouslyAllowBrowser: true,
  })
}

export async function chatOnce(messages: LLMMessage[]): Promise<string> {
  const client = getClient()

  const response = await client.chat.completions.create({
    model: DEEPSEEK_CHAT_MODEL,
    messages,
  })

  return response.choices[0]?.message?.content ?? ''
}
