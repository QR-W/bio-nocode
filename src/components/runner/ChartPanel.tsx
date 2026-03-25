import { Card, Empty, Row, Col } from 'antd'
import {
    LineChart, Line, BarChart, Bar,
    ScatterChart, Scatter, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer,
} from 'recharts'
import type { FieldDef, ChartConfig, DataRecord } from '../../types/AppConfig'

const COLORS = ['#4F46E5', '#059669', '#D97706', '#DC2626', '#7C3AED', '#0891B2']

interface Props {
    fields: FieldDef[]
    charts: ChartConfig[]
    records: DataRecord[]
}

export default function ChartPanel({ charts, records }: Props) {
    if (charts.length === 0) {
        return (
            <Empty
                description="该应用暂未配置图表，可通过迭代修改添加"
                style={{ padding: 60 }}
            />
        )
    }

    return (
        <Row gutter={[20, 20]}>
            {charts.map((chart, idx) => {
                // 在外层计算 data，方便判断是否为空
                const data = records
                    .map(r => ({
                        x: r.data[chart.xField],
                        y: r.data[chart.yField],
                    }))
                    .filter(d => d.x !== undefined && d.y !== undefined)
                    .reverse()

                return (
                    <Col span={chart.type === 'pie' ? 12 : 24} key={chart.id}>
                        <Card title={chart.title}>
                            {data.length === 0 ? (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description="暂无数据，请先录入实验记录"
                                    style={{ padding: 24 }}
                                />
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    {renderChart(chart, data, idx)}
                                </ResponsiveContainer>
                            )}
                        </Card>
                    </Col>
                )
            })}
        </Row>
    )
}

function renderChart(
    chart: ChartConfig,
    data: { x: unknown; y: unknown }[],
    idx: number,
) {
    const color = COLORS[idx % COLORS.length]

    switch (chart.type) {
        case 'line':
            return (
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="x" />
                    <YAxis />
                    <Tooltip />
                    <Line
                        type="monotone"
                        dataKey="y"
                        stroke={color}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                    />
                </LineChart>
            )

        case 'bar':
            return (
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="x" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="y" fill={color} radius={[4, 4, 0, 0]} />
                </BarChart>
            )

        case 'scatter':
            return (
                <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="x" name={chart.xField} />
                    <YAxis dataKey="y" name={chart.yField} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter data={data} fill={color} />
                </ScatterChart>
            )

        case 'pie': {
            const pieData = data.map(d => ({
                name: String(d.x),
                value: Number(d.y),
            }))
            return (
                <PieChart>
                    <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percent }) =>
                            `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                        }
                    >
                        {pieData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
            )
        }

        default:
            return (
                <LineChart data={data}>
                    <Line dataKey="y" />
                </LineChart>
            )
    }
}