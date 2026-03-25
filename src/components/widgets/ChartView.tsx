import { Empty } from 'antd'
import ChartPanel from '../runner/ChartPanel'
import type { WidgetProps } from './types'
import type { ChartType } from '../../types/AppConfig'

export default function ChartViewWidget({ config, records, props }: WidgetProps) {
    // props 里有手动配置的图表，优先使用
    if (props?.xField && props?.yField) {
        const overrideCharts = [{
            id: 'override_1',
            title: props.chartTitle as string ?? '图表',
            type: (props.chartType as ChartType) ?? 'line',
            xField: props.xField as string,
            yField: props.yField as string,
        }]
        return (
            <ChartPanel fields={config.fields} charts={overrideCharts} records={records} />
        )
    }

    // 没有手动配置时，从 views.charts 里取一张
    // 用 chartIndex 指定取第几张，默认取第 0 张
    const chartIndex = (props?.chartIndex as number) ?? 0
    const chart = config.views.charts[chartIndex]

    if (!chart) {
        return <Empty description="暂未配置图表" />
    }

    return (
        <ChartPanel fields={config.fields} charts={[chart]} records={records} />
    )
}