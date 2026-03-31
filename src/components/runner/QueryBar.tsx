import { useState } from 'react'
import { Input, Button, Typography, Spin } from 'antd'
import { SearchOutlined, CloseCircleOutlined } from '@ant-design/icons'
import type { FieldDef } from '../../types/AppConfig'
import type { DataRecord } from '../../types/AppConfig'
import { chatOnce } from '../../services/llm/llmClient'

const { Text } = Typography

interface Props {
  fields: FieldDef[]
  /** 用户点击「查询」时再加载用于筛选的全量数据 */
  getRecordsForQuery: () => Promise<DataRecord[]>
  onResult: (filtered: DataRecord[] | null) => void
}

export default function QueryBar({ fields, getRecordsForQuery, onResult }: Props) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(false)

  async function handleQuery() {
    const text = input.trim()
    if (!text) return

    setLoading(true)
    try {
      const records = await getRecordsForQuery()

      const fieldDesc = fields.map(f => `${f.name}(${f.label}, ${f.type})`).join(', ')
      const prompt = `
你是一个数据过滤助手。
当前数据表的字段有：${fieldDesc}
用户的查询需求：${text}

请返回一个 JSON 数组，描述过滤条件，格式如下：
[
  { "field": "字段name", "op": "eq|gt|lt|gte|lte|contains", "value": 过滤值 }
]
只返回 JSON 数组，不要包含其他内容。
如果无法转换，返回空数组 []。
      `.trim()

      const raw = await chatOnce([{ role: 'user', content: prompt }])

      const json = raw.match(/\[[\s\S]*\]/)?.[0] ?? '[]'
      const filters: { field: string; op: string; value: unknown }[] = JSON.parse(json)

      if (filters.length === 0) {
        onResult(null)
        setActive(false)
        return
      }

      const result = records.filter(record =>
        filters.every(f => applyFilter(record.data[f.field], f.op, f.value)),
      )

      onResult(result)
      setActive(true)
    } catch {
      onResult(null)
      setActive(false)
    } finally {
      setLoading(false)
    }
  }

  function handleClear() {
    setInput('')
    setActive(false)
    onResult(null)
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onPressEnter={handleQuery}
          placeholder="用自然语言查询，例如：活率大于 90% 的记录"
          prefix={loading ? <Spin size="small" /> : <SearchOutlined style={{ color: '#aaa' }} />}
          disabled={loading}
          aria-label="自然语言查询条件"
        />
        <Button
          type="primary"
          onClick={handleQuery}
          loading={loading}
          disabled={!input.trim()}
        >
          查询
        </Button>
        {active && (
          <Button
            icon={<CloseCircleOutlined />}
            onClick={handleClear}
          >
            清除
          </Button>
        )}
      </div>
      {active && (
        <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
          已过滤（已筛选全表数据）；点击「清除」恢复分页列表
        </Text>
      )}
    </div>
  )
}

function applyFilter(val: unknown, op: string, target: unknown): boolean {
  if (val === undefined || val === null) return false
  const a = typeof val === 'number' ? val : String(val)
  const b = typeof target === 'number' ? target : String(target)

  switch (op) {
    case 'eq': return a == b
    case 'gt': return Number(a) > Number(b)
    case 'lt': return Number(a) < Number(b)
    case 'gte': return Number(a) >= Number(b)
    case 'lte': return Number(a) <= Number(b)
    case 'contains': return String(a).includes(String(b))
    default: return true
  }
}
