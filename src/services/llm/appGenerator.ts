import { chatOnce } from './llmClient'
import { buildSystemPrompt, buildCreatePrompt, buildUpdatePrompt } from './prompts'
import type { AppConfig, ExperimentType, PartialAppConfig } from '../../types/AppConfig'

// ─── 从 LLM 返回的字符串中提取 JSON ──────────────────────────
// LLM 有时会在 JSON 前后加上 markdown 代码块，需要清理掉

function extractJSON(raw: string): string {
  // 去掉 ```json ... ``` 或 ``` ... ```
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (match) return match[1]
  // 没有代码块就直接返回，trim 掉首尾空白
  return raw.trim()
}

// ─── 校验 LLM 返回的配置是否基本合法 ────────────────────────
// 只做最基础的校验，不求完美，能用就行

function validateConfig(config: unknown): config is PartialAppConfig {
  if (typeof config !== 'object' || config === null) return false
  const c = config as Record<string, unknown>
  if (typeof c.name !== 'string') return false
  if (!Array.isArray(c.fields)) return false
  return true
}

// ─── 首次生成 ────────────────────────────────────────────────

export async function generateApp(
  userInput: string,
  experimentType: ExperimentType,
): Promise<PartialAppConfig> {
  const messages = [
    { role: 'system' as const, content: buildSystemPrompt(experimentType) },
    { role: 'user'   as const, content: buildCreatePrompt(userInput) },
  ]

  const raw = await chatOnce(messages)
  const json = extractJSON(raw)

  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error('LLM 返回的内容无法解析为 JSON，请重试')
  }

  if (!validateConfig(parsed)) {
    throw new Error('LLM 返回的配置格式不正确，请重试')
  }

  return parsed as PartialAppConfig
}

// ─── 迭代修改 ────────────────────────────────────────────────

export async function updateApp(
  userInput: string,
  currentConfig: AppConfig,
): Promise<PartialAppConfig> {
  const messages = [
    { role: 'system' as const, content: buildSystemPrompt(currentConfig.experimentType) },
    { role: 'user'   as const, content: buildUpdatePrompt(userInput, currentConfig) },
  ]

  const raw = await chatOnce(messages)
  const json = extractJSON(raw)

  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error('LLM 返回的内容无法解析为 JSON，请重试')
  }

  if (!validateConfig(parsed)) {
    throw new Error('LLM 返回的配置格式不正确，请重试')
  }

  return parsed as PartialAppConfig
}