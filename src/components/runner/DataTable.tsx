import { Table, Button, Popconfirm, Typography } from 'antd'
import { DeleteOutlined, DownloadOutlined } from '@ant-design/icons'
import type { FieldDef } from '../../types/AppConfig'
import type { DataRecord } from '../../types/AppConfig'
import type { RecordsRemotePagination } from '../widgets/types'

const { Text } = Typography

const VIRTUAL_THRESHOLD = 80

interface Props {
  fields: FieldDef[]
  records: DataRecord[]
  onDelete: (id: string) => void
  onExport?: () => void
  pageSize?: number
  allowRecordDelete?: boolean
  allowRecordExport?: boolean
  /** Dexie 分页：与 antd Table 受控分页联动 */
  remotePagination?: RecordsRemotePagination
  /** 筛选模式下数据在客户端，总条数即 records.length */
  isFiltered?: boolean
}

export default function DataTable({
  fields,
  records,
  pageSize,
  remotePagination,
  isFiltered,
  onDelete,
  onExport,
  allowRecordDelete = true,
  allowRecordExport = true,
}: Props) {

  const baseColumns = [
    ...fields.map(field => ({
      title: field.label,
      dataIndex: ['data', field.name],
      key: field.name,
      ellipsis: true,
      render: (val: unknown) => renderCell(val, field),
    })),
    {
      title: '录入时间',
      key: 'createdAt',
      width: 160,
      render: (_: unknown, record: DataRecord) =>
        new Date(record.createdAt).toLocaleString('zh-CN', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
    },
  ]

  const actionColumn = {
    title: '操作',
    key: 'action',
    width: 80,
    render: (_: unknown, record: DataRecord) => (
      <Popconfirm
        title="确认删除这条记录？"
        onConfirm={() => onDelete(record.id)}
        okText="删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
        />
      </Popconfirm>
    ),
  }

  const columns = allowRecordDelete
    ? [...baseColumns, actionColumn]
    : baseColumns

  const totalLabel = isFiltered
    ? records.length
    : (remotePagination?.total ?? records.length)

  const useVirtual = records.length >= VIRTUAL_THRESHOLD

  const pagination = remotePagination && !isFiltered
    ? {
        current: remotePagination.page,
        pageSize: remotePagination.pageSize,
        total: remotePagination.total,
        showSizeChanger: true,
        pageSizeOptions: [20, 50, 100, 200],
        onChange: (p: number, ps: number) => remotePagination.onPageChange(p, ps),
      }
    : {
        pageSize: pageSize ?? 10,
        showSizeChanger: !isFiltered,
      }

  return (
    <div>
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        marginBottom:   12,
      }}>
        <Text type="secondary">{totalLabel} 条记录{isFiltered ? '（已筛选）' : ''}</Text>
        {allowRecordExport && onExport && (
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={onExport}
            disabled={totalLabel === 0}
          >
            导出 CSV
          </Button>
        )}
      </div>

      <Table
        columns={columns}
        dataSource={records}
        rowKey="id"
        size="small"
        pagination={pagination}
        virtual={useVirtual}
        scroll={useVirtual ? { x: 'max-content', y: 480 } : { x: 'max-content' }}
        locale={{ emptyText: '暂无数据，请在左侧填写表单提交' }}
      />
    </div>
  )
}

function renderCell(val: unknown, field: FieldDef): React.ReactNode {
  if (val === undefined || val === null) return <Text type="secondary">—</Text>

  switch (field.type) {
    case 'boolean':
      return val ? '是' : '否'

    case 'multiselect':
      return Array.isArray(val) ? val.join('、') : String(val)

    case 'file':
      return <Text type="secondary">（文件）</Text>

    default:
      return String(val)
  }
}
