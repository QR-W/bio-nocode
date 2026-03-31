// 所有 Widget 组件共用的 props 基础接口

import type { AppConfig, DataRecord } from '../../types/AppConfig'

export interface RecordAggregate {
  total: number
  thisMonthCount: number
  latestCreatedAt: string | null
}

export interface RecordsRemotePagination {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number, pageSize: number) => void
}

export interface WidgetProps {
  config: AppConfig
  /** 当前表格页数据（Dexie 分页时仅一页） */
  records: DataRecord[]
  onSubmit?: (values: Record<string, unknown>) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  onExport?: () => void
  onQuery?: (filtered: DataRecord[] | null) => void
  props?: Record<string, unknown>   // 组件自定义参数
  onLogin?: (password: string, username?: string) => boolean
  currentUsername?: string

  /** 表格：服务端分页元信息（与 records 同时使用） */
  recordsRemote?: RecordsRemotePagination
  /** 图表/时间轴：最近最多 RECORD_SAMPLE_MAX 条，避免全量进内存 */
  recordsSample?: DataRecord[]
  /** 统计卡片：全表聚合 */
  recordAggregate?: RecordAggregate
  /** QueryBar：用户点击查询时再拉全表并过滤 */
  getRecordsForQuery?: () => Promise<DataRecord[]>
}
