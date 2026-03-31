import { Card, Row, Col, Statistic } from 'antd'
import type { WidgetProps } from './types'

export default function StatsCardsWidget({
  records,
  config,
  props,
  recordAggregate,
}: WidgetProps) {
  const showTotal = props?.showTotal !== false
  const showThisMonth = props?.showThisMonth !== false
  const showFields = props?.showFields !== false
  const showLastDate = props?.showLastDate !== false

  const cardBackground = props?.cardBackground as string | undefined
  const titleColor = props?.titleColor as string | undefined
  const titleSize = props?.titleSize as number | undefined
  const valueColor = props?.valueColor as string | undefined

  const total = recordAggregate?.total ?? records.length
  const thisMonth = recordAggregate
    ? recordAggregate.thisMonthCount
    : records.filter(r => {
      const d = new Date(r.createdAt)
      const n = new Date()
      return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear()
    }).length

  const lastDateStr = recordAggregate?.latestCreatedAt
    ? new Date(recordAggregate.latestCreatedAt).toLocaleDateString('zh-CN')
    : (records[0]
      ? new Date(records[0].createdAt).toLocaleDateString('zh-CN')
      : '暂无')

  const items = [
    showTotal && { title: '总记录数', value: total, suffix: '条', color: valueColor ?? '#4F46E5', isText: false },
    showThisMonth && { title: '本月新增', value: thisMonth, suffix: '条', color: valueColor ?? '#059669', isText: false },
    showFields && { title: '字段数量', value: config.fields.length, suffix: '个', color: valueColor ?? '#D97706', isText: false },
    showLastDate && {
      title: '最近录入',
      value: lastDateStr,
      suffix: '',
      color: valueColor ?? '#6B7280',
      isText: true,
    },
  ].filter(Boolean) as {
    title: string; value: number | string
    suffix: string; color: string; isText: boolean
  }[]

  const span = Math.floor(24 / (items.length || 1))

  return (
    <Row gutter={[16, 16]}>
      {items.map(item => (
        <Col span={span} key={item.title}>
          <Card
            style={{ background: cardBackground }}
            styles={{ body: { padding: '20px 24px' } }}
          >
            <Statistic
              title={
                <span style={{
                  color: titleColor,
                  fontSize: titleSize,
                }}>
                  {item.title}
                </span>
              }
              value={item.value}
              suffix={item.suffix}
              valueStyle={{
                color: item.color,
                fontSize: item.isText ? 16 : undefined,
              }}
            />
          </Card>
        </Col>
      ))}
    </Row>
  )
}
