import { useState } from 'react'
import {
  Typography, Empty, Button, Tooltip,
  Drawer, Tag, Divider
} from 'antd'
import {
  CheckOutlined, EditOutlined,
  PlusOutlined, SettingOutlined
} from '@ant-design/icons'
import type { AppConfig, FieldDef, ComponentConfig, PageConfig } from '../../types/AppConfig'
import AppPreview from '../runner/AppPreview'
import FieldEditorDrawer from './FieldEditorDrawer'
import ComponentStyleDrawer from './ComponentStyleDrawer'

const { Text } = Typography

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: '文本',
  textarea: '多行文本',
  number: '数字',
  date: '日期',
  select: '单选',
  multiselect: '多选',
  boolean: '开关',
  file: '文件',
}

interface Props {
  config: AppConfig | null
  onConfigChange: (config: AppConfig) => void
  onConfirm: () => void
  loading: boolean
}

export default function ConfigPreview({
  config, onConfigChange, onConfirm, loading
}: Props) {
  // 字段管理 Drawer
  const [fieldMgrOpen, setFieldMgrOpen] = useState(false)
  const [fieldDrawerOpen, setFieldDrawerOpen] = useState(false)
  const [editingField, setEditingField] = useState<FieldDef | null>(null)

  // 样式编辑 Drawer
  const [styleDrawerOpen, setStyleDrawerOpen] = useState(false)
  const [editingComponent, setEditingComponent] = useState<ComponentConfig | null>(null)
  const [editingPage, setEditingPage] = useState<PageConfig | null>(null)
  const [styleMode, setStyleMode] = useState<'component' | 'page'>('component')

  if (!config) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        flexDirection: 'column',
        gap: 12,
      }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="对话后将在此预览生成的应用"
        />
      </div>
    )
  }

  // ── 字段相关 ──────────────────────────────────────────────────

  function handleSaveField(field: FieldDef) {
    const exists = config.fields.some(f => f.name === field.name)
    const newFields = exists
      ? config.fields.map(f => f.name === field.name ? field : f)
      : [...config.fields, field]

    const newColumns = (!exists && config.views.tableColumns.length < 6)
      ? [...config.views.tableColumns, field.name]
      : config.views.tableColumns

    onConfigChange({
      ...config,
      fields: newFields,
      views: { ...config.views, tableColumns: newColumns },
    })
    setFieldDrawerOpen(false)
  }

  function handleDeleteField(name: string) {
    onConfigChange({
      ...config,
      fields: config.fields.filter(f => f.name !== name),
      views: {
        ...config.views,
        tableColumns: config.views.tableColumns.filter(c => c !== name),
      },
    })
  }

  // ── 样式相关 ──────────────────────────────────────────────────

  function handleSaveStyle(updated: ComponentConfig | PageConfig) {
    if (styleMode === 'component') {
      const comp = updated as ComponentConfig
      const newPages = config.pages.map(p => ({
        ...p,
        components: p.components.map(c => c.id === comp.id ? comp : c),
      }))
      onConfigChange({ ...config, pages: newPages })
    }

    if (styleMode === 'page') {
      const pg = updated as PageConfig
      const newPages = config.pages.map(p => p.key === pg.key ? pg : p)
      onConfigChange({ ...config, pages: newPages })
    }

    setStyleDrawerOpen(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* 顶部工具栏 */}
      <div style={{
        padding: '10px 16px',
        borderBottom: '1px solid #f0f0f0',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        flexShrink: 0,
      }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          应用预览 · {config.fields.length} 个字段
        </Text>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => setFieldMgrOpen(true)}
          >
            字段管理
          </Button>
          <Button
            size="small"
            type="primary"
            icon={<CheckOutlined />}
            loading={loading}
            onClick={onConfirm}
          >
            确认创建
          </Button>
        </div>
      </div>

      {/* 运行界面预览 */}
      <div style={{ flex: 1, overflow: 'hidden', padding: 12 }}>
        <AppPreview
          config={config}
          onConfigChange={onConfigChange}
        />
      </div>

      {/* ── 字段管理 Drawer ── */}
      <Drawer
        title="字段管理"
        open={fieldMgrOpen}
        onClose={() => setFieldMgrOpen(false)}
        width={420}
        extra={
          <Button
            size="small"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingField(null)
              setFieldDrawerOpen(true)
            }}
          >
            添加字段
          </Button>
        }
      >
        {/* 字段列表 */}
        <Text strong style={{ fontSize: 13 }}>字段列表</Text>
        <div style={{ marginTop: 8, marginBottom: 20 }}>
          {config.fields.map(field => (
            <div
              key={field.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                marginBottom: 6,
                background: '#F9FAFB',
                borderRadius: 8,
              }}
            >
              <div>
                <Text strong style={{ fontSize: 13 }}>{field.label}</Text>
                {field.required && (
                  <Text type="danger" style={{ marginLeft: 4 }}>*</Text>
                )}
                {field.unit && (
                  <Text type="secondary" style={{ fontSize: 12, marginLeft: 4 }}>
                    ({field.unit})
                  </Text>
                )}
              </div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <Tag style={{ margin: 0 }}>
                  {FIELD_TYPE_LABELS[field.type] ?? field.type}
                </Tag>
                <Tooltip title="编辑">
                  <Button
                    type="text" size="small"
                    icon={<EditOutlined />}
                    onClick={() => {
                      setEditingField(field)
                      setFieldDrawerOpen(true)
                    }}
                  />
                </Tooltip>
                <Tooltip title="删除">
                  <Button
                    type="text" size="small" danger
                    icon={<span style={{ fontSize: 12 }}>✕</span>}
                    onClick={() => handleDeleteField(field.name)}
                  />
                </Tooltip>
              </div>
            </div>
          ))}
        </div>

        <Divider style={{ margin: '8px 0' }} />

        {/* 页面与组件样式 */}
        <Text strong style={{ fontSize: 13 }}>页面与组件样式</Text>
        <div style={{ marginTop: 8 }}>
          {config.pages
            .filter(p => !p.components.some(c => c.type === 'LoginForm'))
            .map(page => (
              <div key={page.key} style={{ marginBottom: 16 }}>

                {/* 页面标题行 */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 6,
                }}>
                  <Text strong style={{ fontSize: 13 }}>{page.title}</Text>
                  <Button
                    size="small"
                    icon={<SettingOutlined />}
                    onClick={() => {
                      setEditingPage(page)
                      setStyleMode('page')
                      setStyleDrawerOpen(true)
                    }}
                  >
                    页面样式
                  </Button>
                </div>

                {/* 组件列表 */}
                {page.components.map(comp => (
                  <div
                    key={comp.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '6px 10px',
                      background: '#F9FAFB',
                      borderRadius: 6,
                      marginBottom: 4,
                    }}
                  >
                    <div>
                      <Text style={{ fontSize: 12 }}>
                        {comp.title ?? comp.type}
                      </Text>
                      {comp.style?.span && (
                        <Text
                          type="secondary"
                          style={{ marginLeft: 6, fontSize: 11 }}
                        >
                          ({comp.style.span}/24)
                        </Text>
                      )}
                    </div>
                    <Button
                      size="small"
                      icon={<SettingOutlined />}
                      onClick={() => {
                        setEditingComponent(comp)
                        setStyleMode('component')
                        setStyleDrawerOpen(true)
                      }}
                    >
                      样式
                    </Button>
                  </div>
                ))}
              </div>
            ))
          }
        </div>
      </Drawer>

      {/* ── 字段编辑 Drawer ── */}
      <FieldEditorDrawer
        open={fieldDrawerOpen}
        field={editingField}
        onSave={handleSaveField}
        onCancel={() => setFieldDrawerOpen(false)}
      />

      {/* ── 样式编辑 Drawer ── */}
      <ComponentStyleDrawer
        open={styleDrawerOpen}
        component={editingComponent}
        page={editingPage}
        mode={styleMode}
        config={config}
        onSave={handleSaveStyle}
        onCancel={() => setStyleDrawerOpen(false)}
      />

    </div>
  )
}