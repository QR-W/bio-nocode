import { Card, Timeline as AntTimeline, Typography, Tag, Empty } from 'antd'
import { ClockCircleOutlined } from '@ant-design/icons'
import type { WidgetProps } from './types'

const { Title, Text } = Typography

export default function TimelineWidget({ config, records, props }: WidgetProps) {
    if (records.length === 0) {
        return <Empty description="暂无记录" />
    }

    // 取前20条，按时间展示
    const labelField = config.fields[0]?.name
    const contentField = config.fields[1]?.name

    const items = records.slice(0, 20).map(r => ({
        dot: <ClockCircleOutlined style={{ color: '#4F46E5' }} />,
        label: new Date(r.createdAt).toLocaleDateString('zh-CN'),
        children: (
            <div>
                <Text strong>
                    {labelField ? String(r.data[labelField] ?? '') : '记录'}
                </Text>
                {contentField && (
                    <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                        {String(r.data[contentField] ?? '')}
                    </Text>
                )}
            </div>
        ),
    }))

    return (
        <Card title={String(props?.title ?? '实验时间轴')}>
            <AntTimeline mode="left" items={items} />
        </Card>
    )
}