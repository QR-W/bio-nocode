import { Card, Row, Col, Statistic, Typography, Button } from 'antd'
import {
    FormOutlined, TableOutlined,
    BarChartOutlined, CalendarOutlined,
} from '@ant-design/icons'
import type { AppConfig, DataRecord } from '../../types/AppConfig'

const { Title, Text } = Typography

interface Props {
    app: AppConfig
    records: DataRecord[]
    onNavigate: (key: 'input' | 'list' | 'chart') => void
}

export default function OverviewPanel({ app, records, onNavigate }: Props) {
    const lastRecord = records[0]
    const lastDate = lastRecord
        ? new Date(lastRecord.createdAt).toLocaleDateString('zh-CN')
        : '暂无记录'

    const thisMonth = records.filter(r => {
        const d = new Date(r.createdAt)
        const n = new Date()
        return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear()
    }).length

    return (
        <div>
            {/* 统计卡片 */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="总记录数"
                            value={records.length}
                            suffix="条"
                            valueStyle={{ color: '#4F46E5' }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="本月新增"
                            value={thisMonth}
                            suffix="条"
                            valueStyle={{ color: '#059669' }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="字段数量"
                            value={app.fields.length}
                            suffix="个"
                            valueStyle={{ color: '#D97706' }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="最近录入"
                            value={lastDate}
                            valueStyle={{ fontSize: 16, color: '#6B7280' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* 快捷入口 */}
            <Title level={5} style={{ marginBottom: 16 }}>快捷操作</Title>
            <Row gutter={[16, 16]}>
                <Col span={8}>
                    <Card
                        hoverable
                        onClick={() => onNavigate('input')}
                        style={{ textAlign: 'center', cursor: 'pointer' }}
                    >
                        <FormOutlined style={{ fontSize: 32, color: '#4F46E5', marginBottom: 8 }} />
                        <br />
                        <Text strong>录入数据</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>填写实验记录</Text>
                    </Card>
                </Col>
                <Col span={8}>
                    <Card
                        hoverable
                        onClick={() => onNavigate('list')}
                        style={{ textAlign: 'center', cursor: 'pointer' }}
                    >
                        <TableOutlined style={{ fontSize: 32, color: '#059669', marginBottom: 8 }} />
                        <br />
                        <Text strong>查看数据</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>浏览和查询记录</Text>
                    </Card>
                </Col>
                <Col span={8}>
                    <Card
                        hoverable
                        onClick={() => onNavigate('chart')}
                        style={{ textAlign: 'center', cursor: 'pointer' }}
                    >
                        <BarChartOutlined style={{ fontSize: 32, color: '#D97706', marginBottom: 8 }} />
                        <br />
                        <Text strong>图表分析</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>可视化数据趋势</Text>
                    </Card>
                </Col>
            </Row>

            {/* 应用信息 */}
            <Card style={{ marginTop: 24 }} title="应用信息">
                <Text type="secondary">{app.description}</Text>
                <div style={{ marginTop: 12 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        版本 v{app.version} · {app.fields.length} 个字段
                        {app.views.charts.length > 0 && ` · ${app.views.charts.length} 个图表`}
                    </Text>
                </div>
            </Card>
        </div>
    )
}