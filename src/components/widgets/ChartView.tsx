import { Empty } from 'antd'
import ChartPanel from '../runner/ChartPanel'
import type { WidgetProps } from './types'
import type { ChartType } from '../../types/AppConfig'

export default function ChartViewWidget({ config, records, recordsSample, props }: WidgetProps) {
  const viz = recordsSample ?? records

  if (props?.xField && props?.yField) {
    const overrideCharts = [{
      id: 'override_1',
      title: props.chartTitle as string ?? '图表',
      type: (props.chartType as ChartType) ?? 'line',
      xField: props.xField as string,
      yField: props.yField as string,
    }]
    return (
      <ChartPanel fields={config.fields} charts={overrideCharts} records={viz} />
    )
  }

  const chartIndex = (props?.chartIndex as number) ?? 0
  const chart = config.views.charts[chartIndex]

  if (!chart) {
    return <Empty description="暂未配置图表" />
  }

  return (
    <ChartPanel fields={config.fields} charts={[chart]} records={viz} />
  )
}
