import { useState } from 'react'
import { Card, Typography, Button, Tooltip } from 'antd'
import { HolderOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import {
    DndContext, closestCenter, PointerSensor,
    KeyboardSensor, useSensor, useSensors,
    type DragEndEvent,
} from '@dnd-kit/core'
import {
    SortableContext, verticalListSortingStrategy,
    useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { FieldDef, AppConfig } from '../../types/AppConfig'
import FieldEditorDrawer from './FieldEditorDrawer'

const { Text } = Typography

const FIELD_TYPE_LABELS: Record<string, string> = {
    text: '单行文本',
    textarea: '多行文本',
    number: '数字',
    date: '日期',
    select: '单选',
    multiselect: '多选',
    boolean: '开关',
    file: '文件',
}

// 单个可拖拽字段行
function SortableField({
    field,
    onEdit,
    onDelete,
}: {
    field: FieldDef
    onEdit: (field: FieldDef) => void
    onDelete: (name: string) => void
}) {
    const [hovered, setHovered] = useState(false)

    const {
        attributes, listeners, setNodeRef,
        transform, transition, isDragging,
    } = useSortable({ id: field.name })

    return (
        <div
            ref={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
                opacity: isDragging ? 0.5 : 1,
                marginBottom: 12,
                position: 'relative',
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div style={{
                padding: '10px 12px',
                background: hovered ? '#F5F3FF' : '#FAFAFA',
                borderRadius: 8,
                border: hovered ? '1px solid #4F46E5' : '1px solid #e5e7eb',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
            }}>
                {/* 拖拽手柄 */}
                <div
                    {...attributes}
                    {...listeners}
                    style={{ cursor: 'grab', color: '#9CA3AF', flexShrink: 0 }}
                >
                    <HolderOutlined />
                </div>

                {/* 字段信息 */}
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Text strong style={{ fontSize: 13 }}>{field.label}</Text>
                        {field.required && (
                            <Text type="danger" style={{ fontSize: 12 }}>*</Text>
                        )}
                        {field.unit && (
                            <Text type="secondary" style={{ fontSize: 11 }}>({field.unit})</Text>
                        )}
                    </div>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                        {FIELD_TYPE_LABELS[field.type] ?? field.type}
                        {field.helpText && ` · ${field.helpText}`}
                    </Text>
                </div>

                {/* 操作按钮（hover 时显示）*/}
                {hovered && (
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        <Tooltip title="编辑字段">
                            <Button
                                size="small"
                                type="primary"
                                icon={<EditOutlined />}
                                onClick={() => onEdit(field)}
                            />
                        </Tooltip>
                        <Tooltip title="删除字段">
                            <Button
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => onDelete(field.name)}
                            />
                        </Tooltip>
                    </div>
                )}
            </div>
        </div>
    )
}

interface Props {
    config: AppConfig
    onConfigChange: (config: AppConfig) => void
    submitText?: string
}

export default function EditableFormPreview({
    config, onConfigChange, submitText,
}: Props) {
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [editingField, setEditingField] = useState<FieldDef | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor),
    )

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event
        if (!over || active.id === over.id) return

        const oldIndex = config.fields.findIndex(f => f.name === active.id)
        const newIndex = config.fields.findIndex(f => f.name === over.id)
        const newFields = arrayMove(config.fields, oldIndex, newIndex)

        // 同步更新 tableColumns 顺序
        const newColumns = newFields
            .map(f => f.name)
            .filter(name => config.views.tableColumns.includes(name))

        onConfigChange({
            ...config,
            fields: newFields,
            views: { ...config.views, tableColumns: newColumns },
        })
    }

    function handleSaveField(field: FieldDef) {
        const exists = config.fields.some(f => f.name === field.name)
        const newFields = exists
            ? config.fields.map(f => f.name === field.name ? field : f)
            : [...config.fields, field]

        onConfigChange({ ...config, fields: newFields })
        setDrawerOpen(false)
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

    return (
        <Card>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 12 }}>
                拖拽调整字段顺序，hover 字段可编辑或删除
            </Text>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={config.fields.map(f => f.name)}
                    strategy={verticalListSortingStrategy}
                >
                    {config.fields.map(field => (
                        <SortableField
                            key={field.name}
                            field={field}
                            onEdit={f => {
                                setEditingField(f)
                                setDrawerOpen(true)
                            }}
                            onDelete={handleDeleteField}
                        />
                    ))}
                </SortableContext>
            </DndContext>

            {/* 提交按钮预览 */}
            <div style={{
                marginTop: 16,
                padding: '10px 16px',
                background: '#4F46E5',
                borderRadius: 8,
                textAlign: 'center',
                color: '#fff',
                fontSize: 14,
                cursor: 'default',
            }}>
                {submitText ?? '提交记录'}
            </div>

            <FieldEditorDrawer
                open={drawerOpen}
                field={editingField}
                onSave={handleSaveField}
                onCancel={() => setDrawerOpen(false)}
            />
        </Card>
    )
}