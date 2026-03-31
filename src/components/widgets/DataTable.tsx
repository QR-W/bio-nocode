import { useState } from 'react'
import { Card } from 'antd'
import QueryBar from '../runner/QueryBar'
import DataTableComp from '../runner/DataTable'
import type { WidgetProps } from './types'
import type { DataRecord } from '../../types/AppConfig'

export default function DataTableWidget({
  config,
  records,
  onDelete,
  onExport,
  props,
  recordsRemote,
  getRecordsForQuery,
}: WidgetProps) {
  const [filtered, setFiltered] = useState<DataRecord[] | null>(null)

  const pageSize = props?.pageSize as number | undefined
  const showExport = props?.showExport as boolean | undefined
  const showSearch = props?.showSearch !== false

  const isFiltered = filtered !== null
  const tableData = isFiltered ? filtered : records

  return (
    <Card>
      {showSearch && getRecordsForQuery && (
        <QueryBar
          fields={config.fields}
          getRecordsForQuery={getRecordsForQuery}
          onResult={setFiltered}
        />
      )}
      <DataTableComp
        fields={config.fields}
        records={tableData}
        onDelete={onDelete ?? (async () => { })}
        onExport={showExport === false ? undefined : (onExport ?? (() => { }))}
        pageSize={pageSize}
        remotePagination={recordsRemote}
        isFiltered={isFiltered}
      />
    </Card>
  )
}
