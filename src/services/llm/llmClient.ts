import OpenAI from 'openai'
import { useSettingsStore } from '../../stores/settingsStore'

export type LLMMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// 无论用户选了什么模型，实际都走 DeepSeek
// Base URL 和 API Key 仍从 store 读取，用户只需配置一次
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com'
const DEEPSEEK_MODEL    = 'deepseek-chat'  // 思考模式，生成配置更准确

function getClient(): OpenAI {
  const { apiKey } = useSettingsStore.getState()
  if (!apiKey) throw new Error('请先在设置中填写 API Key')

  return new OpenAI({
    apiKey,
    baseURL: DEEPSEEK_BASE_URL,
    dangerouslyAllowBrowser: true,
  })
}

export async function chatOnce(messages: LLMMessage[]): Promise<string> {
  const client = getClient()

  const response = await client.chat.completions.create({
    model:    DEEPSEEK_MODEL,
    messages,
    // deepseek-reasoner 不支持 temperature 参数，不传即可
  })

  // deepseek-reasoner 返回两个字段：
  // reasoning_content — 推理过程（我们不需要展示）
  // content          — 最终答案（这才是我们要的）
  return response.choices[0]?.message?.content ?? ''
}