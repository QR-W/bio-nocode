import { Input, Card, Typography, Tag } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import type { WidgetProps } from './types'

const { Text } = Typography

export default function SearchBarWidget({ config, records, recordAggregate, props }: WidgetProps) {
  const totalHint = recordAggregate?.total ?? records.length

  return (
    <Card>
      <Input
        size="large"
        prefix={<SearchOutlined />}
        placeholder={String(props?.placeholder ?? `搜索 ${config.name} 的记录...`)}
        style={{ borderRadius: 8 }}
      />
      <div style={{ marginTop: 12 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          共 {totalHint} 条记录，可搜索字段：
        </Text>
        {config.fields.slice(0, 4).map(f => (
          <Tag key={f.name} style={{ marginLeft: 4 }}>{f.label}</Tag>
        ))}
      </div>
    </Card>
  )
}
