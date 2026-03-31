import { chatOnce } from './llmClient'
import { buildSystemPrompt, buildCreatePrompt, buildUpdatePrompt } from './prompts'
import type { AppConfig, ExperimentType, PartialAppConfig } from '../../types/AppConfig'
import { parsePartialAppConfig } from './validatePartialAppConfig'

function extractJSON(raw: string): string {
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (match) return match[1]
  return raw.trim()
}

export async function generateApp(
  userInput: string,
  experimentType: ExperimentType,
): Promise<PartialAppConfig> {
  const messages = [
    { role: 'system' as const, content: buildSystemPrompt(experimentType) },
    { role: 'user' as const, content: buildCreatePrompt(userInput) },
  ]

  const raw = await chatOnce(messages)
  const json = extractJSON(raw)

  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error('LLM 返回的内容无法解析为 JSON，请重试')
  }

  return parsePartialAppConfig(parsed, { mode: 'create' })
}

export async function updateApp(
  userInput: string,
  currentConfig: AppConfig,
): Promise<PartialAppConfig> {
  const messages = [
    { role: 'system' as const, content: buildSystemPrompt(currentConfig.experimentType) },
    { role: 'user' as const, content: buildUpdatePrompt(userInput, currentConfig) },
  ]

  const raw = await chatOnce(messages)
  const json = extractJSON(raw)

  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error('LLM 返回的内容无法解析为 JSON，请重试')
  }

  return parsePartialAppConfig(parsed, {
    mode: 'update',
    currentConfig,
  })
}
