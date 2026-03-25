// 所有 Widget 组件共用的 props 基础接口

import type { AppConfig, DataRecord } from '../../types/AppConfig'

export interface WidgetProps {
    config: AppConfig
    records: DataRecord[]
    onSubmit?: (values: Record<string, unknown>) => Promise<void>
    onDelete?: (id: string) => Promise<void>
    onExport?: () => void
    onQuery?: (filtered: DataRecord[] | null) => void
    props?: Record<string, unknown>   // 组件自定义参数
    onLogin?: (password: string, username?: string) => boolean
    currentUsername?: string
}