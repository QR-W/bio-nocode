import { z } from 'zod'
import type { AppConfig, PartialAppConfig } from '../../types/AppConfig'

const FIELD_TYPES = [
  'text', 'textarea', 'number', 'date', 'select', 'multiselect', 'boolean', 'file',
] as const

const COMPONENT_TYPES = [
  'DataForm', 'DataTable', 'StatsCards', 'ChartView', 'LoginForm', 'SearchBar',
  'RichTextEditor', 'FileUploader', 'Timeline',
] as const

const CHART_TYPES = ['line', 'bar', 'scatter', 'pie'] as const

const EXPERIMENT_TYPES = [
  'passage', 'cryopreservation', 'transfection', 'flow_cytometry', 'drug_assay', 'project',
] as const

const fieldDefSchema = z.object({
  name: z.string().min(1, { message: '不能为空' }),
  label: z.string().min(1, { message: '不能为空' }),
  type: z.enum(FIELD_TYPES),
}).loose()

/** LLM 常省略 id；解析后统一补全为 chart_1、chart_2… */
const chartConfigSchemaInput = z.object({
  id: z.string().optional(),
  title: z.string().min(1, { message: '不能为空' }),
  type: z.enum(CHART_TYPES),
  xField: z.string().min(1, { message: '不能为空' }),
  yField: z.string().min(1, { message: '不能为空' }),
  groupField: z.string().optional(),
}).loose()

const viewConfigSchema = z.object({
  tableColumns: z.array(z.string()),
  defaultSort: z.object({
    field: z.string().min(1),
    order: z.enum(['asc', 'desc']),
  }).optional(),
  charts: z.array(chartConfigSchemaInput).transform(charts =>
    charts.map((ch, i) => {
      const trimmed = typeof ch.id === 'string' ? ch.id.trim() : ''
      const id = trimmed.length > 0 ? trimmed : `chart_${i + 1}`
      return { ...ch, id }
    }),
  ),
}).loose()

const componentConfigSchema = z.object({
  id: z.string().min(1, { message: '不能为空' }),
  type: z.enum(COMPONENT_TYPES),
  title: z.string().optional(),
}).loose()

const pageConfigSchema = z.object({
  key: z.string().min(1, { message: '不能为空' }),
  title: z.string().min(1, { message: '不能为空' }),
  icon: z.string().optional(),
  components: z.array(componentConfigSchema),
}).loose()

const runnerOptionsSchema = z.object({
  allowRecordDelete: z.boolean().optional(),
  allowRecordExport: z.boolean().optional(),
}).loose()

const partialAppConfigShape = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  experimentType: z.enum(EXPERIMENT_TYPES).optional(),
  cellLine: z.string().optional(),
  password: z.string().optional(),
  fields: z.array(fieldDefSchema).optional(),
  views: viewConfigSchema.optional(),
  pages: z.array(pageConfigSchema).optional(),
  runnerOptions: runnerOptionsSchema.optional(),
}).loose()

type PartialShape = z.infer<typeof partialAppConfigShape>

function effectiveFieldNames(data: PartialShape, current?: AppConfig): Set<string> {
  if (data.fields && data.fields.length > 0)
    return new Set(data.fields.map(f => f.name))
  if (current?.fields?.length)
    return new Set(current.fields.map(f => f.name))
  return new Set()
}

function pathLabel(path: (string | number)[]): string {
  if (path.length === 0) return '根'
  let s = ''
  for (const p of path) {
    if (typeof p === 'number') s += `[${p}]`
    else s = s ? `${s}.${p}` : p
  }
  return s
}

function formatZodError(err: z.ZodError): string {
  return err.issues
    .map(issue => {
      const loc = pathLabel(issue.path as (string | number)[])
      return `${loc}：${issue.message}`
    })
    .join('；')
}

function buildSchema(mode: 'create' | 'update', currentConfig?: AppConfig) {
  return partialAppConfigShape.superRefine((data, ctx) => {
    if (mode === 'create') {
      if (!data.name?.trim()) {
        ctx.addIssue({
          code: 'custom',
          message: '首次生成须包含非空的应用名称（name）',
          path: ['name'],
        })
      }
      if (!data.fields || data.fields.length === 0) {
        ctx.addIssue({
          code: 'custom',
          message: '首次生成须至少包含一个字段（fields）',
          path: ['fields'],
        })
      }
    }
    // 迭代模式：允许返回 {}，表示无需改动配置（与前端合并后仍为当前配置）

    const fieldNames = effectiveFieldNames(data, currentConfig)
    const needFieldRefs =
      Boolean(data.views?.charts?.length)
      || Boolean(data.views?.tableColumns?.length)
      || Boolean(data.views?.defaultSort?.field)

    if (needFieldRefs && fieldNames.size === 0) {
      ctx.addIssue({
        code: 'custom',
        message:
          '图表、表格列或排序依赖字段名：请在本轮返回中提供 fields，或沿用已有应用中的字段',
        path: ['views'],
      })
      return
    }

    data.views?.tableColumns?.forEach((col, i) => {
      if (!fieldNames.has(col)) {
        ctx.addIssue({
          code: 'custom',
          message: `「${col}」不是已定义的字段 name`,
          path: ['views', 'tableColumns', i],
        })
      }
    })

    const sortField = data.views?.defaultSort?.field
    if (sortField && !fieldNames.has(sortField)) {
      ctx.addIssue({
        code: 'custom',
        message: `排序字段「${sortField}」不是已定义的字段 name`,
        path: ['views', 'defaultSort', 'field'],
      })
    }

    // "count" is a reserved virtual field for aggregate charts (e.g. records per category)
    const VIRTUAL_FIELDS = new Set(['count'])

    data.views?.charts?.forEach((ch, i) => {
      if (!VIRTUAL_FIELDS.has(ch.xField) && !fieldNames.has(ch.xField)) {
        ctx.addIssue({
          code: 'custom',
          message: `xField「${ch.xField}」不是已定义的字段 name`,
          path: ['views', 'charts', i, 'xField'],
        })
      }
      if (!VIRTUAL_FIELDS.has(ch.yField) && !fieldNames.has(ch.yField)) {
        ctx.addIssue({
          code: 'custom',
          message: `yField「${ch.yField}」不是已定义的字段 name`,
          path: ['views', 'charts', i, 'yField'],
        })
      }
      if (ch.groupField && !VIRTUAL_FIELDS.has(ch.groupField) && !fieldNames.has(ch.groupField)) {
        ctx.addIssue({
          code: 'custom',
          message: `groupField「${ch.groupField}」不是已定义的字段 name`,
          path: ['views', 'charts', i, 'groupField'],
        })
      }
    })
  })
}

export function parsePartialAppConfig(
  raw: unknown,
  options: { mode: 'create' | 'update'; currentConfig?: AppConfig },
): PartialAppConfig {
  const schema = buildSchema(options.mode, options.currentConfig)
  const result = schema.safeParse(raw)
  if (!result.success) {
    throw new Error(`配置校验未通过：${formatZodError(result.error)}`)
  }
  return result.data as PartialAppConfig
}
