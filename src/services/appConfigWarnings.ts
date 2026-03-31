import type { AppConfig } from '../types/AppConfig'

/** 不阻断保存的友好提示，用于构建器预览区 */
export function collectConfigWarnings(config: AppConfig): string[] {
  const w: string[] = []
  const names = new Set<string>()
  for (const f of config.fields ?? []) {
    if (names.has(f.name))
      w.push(`字段标识「${f.name}」重复，可能导致数据混乱。`)
    names.add(f.name)
  }

  const hasLogin = config.pages?.some(p =>
    p.components.some(c => c.type === 'LoginForm'),
  )
  if (hasLogin && !config.password)
    w.push('含有登录页但尚未设置访问密码（保存前请在对话中设置密码）。')

  const fieldNames = new Set((config.fields ?? []).map(f => f.name))
  for (const col of config.views?.tableColumns ?? []) {
    if (!fieldNames.has(col))
      w.push(`列表列「${col}」没有对应字段定义。`)
  }
  for (const ch of config.views?.charts ?? []) {
    if (!fieldNames.has(ch.xField))
      w.push(`图表「${ch.title}」的横轴字段未在 fields 中定义。`)
    if (!fieldNames.has(ch.yField))
      w.push(`图表「${ch.title}」的纵轴字段未在 fields 中定义。`)
  }

  if ((config.fields?.length ?? 0) === 0)
    w.push('当前没有任何字段，运行页将无法录入业务数据。')

  return w
}
