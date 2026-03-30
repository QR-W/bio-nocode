import { Table, Button, Popconfirm, Typography } from 'antd'
import { DeleteOutlined, DownloadOutlined } from '@ant-design/icons'
import type { FieldDef } from '../../types/AppConfig'
import type { DataRecord } from '../../types/AppConfig'

const { Text } = Typography

interface Props {
  fields:    FieldDef[]
  records:   DataRecord[]
  onDelete:  (id: string) => void
  onExport?: () => void
  pageSize?: number
}

export default function DataTable({ fields, records, pageSize, onDelete, onExport }: Props) {

  // 根据 fields 动态生成列配置
  const columns = [
    ...fields.map(field => ({
      title:     field.label,
      dataIndex: ['data', field.name],
      key:       field.name,
      ellipsis:  true,
      render:    (val: unknown) => renderCell(val, field),
    })),
    {
      title:  '录入时间',
      key:    'createdAt',
      width:  160,
      render: (_: unknown, record: DataRecord) =>
        new Date(record.createdAt).toLocaleString('zh-CN', {
          month:  '2-digit',
          day:    '2-digit',
          hour:   '2-digit',
          minute: '2-digit',
        }),
    },
    {
      title:  '操作',
      key:    'action',
      width:  80,
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
    },
  ]

  return (
    <div>
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        marginBottom:   12,
      }}>
        <Text type="secondary">{records.length} 条记录</Text>
        {onExport && (
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={onExport}
            disabled={records.length === 0}
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
        pagination={{ pageSize: pageSize ?? 10, showSizeChanger: false }}        scroll={{ x: 'max-content' }}
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