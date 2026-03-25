import { useState } from 'react'
import { Card } from 'antd'
import QueryBar from '../runner/QueryBar'
import DataTableComp from '../runner/DataTable'
import type { WidgetProps } from './types'
import type { DataRecord } from '../../types/AppConfig'

export default function DataTableWidget({
    config, records, onDelete, onExport, props
}: WidgetProps) {
    const [filtered, setFiltered] = useState<DataRecord[] | null>(null)

    const pageSize = props?.pageSize as number | undefined
    const showExport = props?.showExport as boolean | undefined
    const showSearch = props?.showSearch !== false   // 默认显示

    return (
        <Card>
            {showSearch && (
                <QueryBar
                    fields={config.fields}
                    records={records}
                    onResult={setFiltered}
                />
            )}
            <DataTableComp
                fields={config.fields}
                records={filtered ?? records}
                onDelete={onDelete ?? (async () => { })}
                onExport={showExport === false ? undefined : (onExport ?? (() => { }))}
                pageSize={pageSize}
            />
        </Card>
    )
}