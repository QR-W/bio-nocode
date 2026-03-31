import { useState } from 'react'
import { Card } from 'antd'
import QueryBar from './QueryBar'
import DataTable from './DataTable'
import type { FieldDef, DataRecord } from '../../types/AppConfig'

interface Props {
    fields: FieldDef[]
    records: DataRecord[]
    onDelete: (id: string) => void
    onExport: () => void
    allowRecordDelete?: boolean
    allowRecordExport?: boolean
}

export default function TablePanel({
  fields,
  records,
  onDelete,
  onExport,
  allowRecordDelete = true,
  allowRecordExport = true,
}: Props) {
    const [filtered, setFiltered] = useState<DataRecord[] | null>(null)
    const display = filtered ?? records

    return (
        <Card>
            <QueryBar
                fields={fields}
                getRecordsForQuery={async () => records}
                onResult={setFiltered}
            />
            <DataTable
                fields={fields}
                records={display}
                onDelete={onDelete}
                onExport={onExport}
                allowRecordDelete={allowRecordDelete}
                allowRecordExport={allowRecordExport}
                isFiltered={filtered !== null}
            />
        </Card>
    )
}