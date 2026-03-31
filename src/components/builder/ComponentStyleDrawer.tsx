import { useEffect } from 'react'
import {
    Drawer, Form, InputNumber, Input,
    Button, Slider, Divider, Select, Switch,
} from 'antd'
import type { ComponentConfig, PageConfig, AppConfig } from '../../types/AppConfig'

const SPAN_OPTIONS = [
    { label: '整行（24）', value: 24 },
    { label: '半行（12）', value: 12 },
    { label: '三分之一（8）', value: 8 },
    { label: '四分之一（6）', value: 6 },
]

const CHART_TYPE_OPTIONS = [
    { label: '折线图', value: 'line' },
    { label: '柱状图', value: 'bar' },
    { label: '散点图', value: 'scatter' },
    { label: '饼图', value: 'pie' },
]

interface PropsSchema {
    key: string
    label: string
    type: 'text' | 'number' | 'switch' | 'select'
    options?: { label: string; value: string | number }[]
    placeholder?: string
}

function getPropsSchema(
    componentType: string,
    fieldOptions: { label: string; value: string }[],
): PropsSchema[] {
    switch (componentType) {
        case 'DataForm':
            return [
                { key: 'submitText', label: '提交按钮文字', type: 'text', placeholder: '提交记录' },
            ]
        case 'DataTable':
            return [
                { key: 'pageSize', label: '每页显示条数', type: 'number', placeholder: '10' },
                { key: 'showExport', label: '显示导出按钮', type: 'switch' },
                { key: 'showSearch', label: '显示内部搜索栏', type: 'switch' }
            ]
        case 'StatsCards':
            return [
                { key: 'showTotal', label: '显示总记录数', type: 'switch' },
                { key: 'showThisMonth', label: '显示本月新增', type: 'switch' },
                { key: 'showFields', label: '显示字段数量', type: 'switch' },
                { key: 'showLastDate', label: '显示最近录入', type: 'switch' },
                { key: 'cardBackground', label: '子卡片背景色', type: 'text', placeholder: '#ffffff' },
                { key: 'titleColor', label: '标题颜色', type: 'text', placeholder: '#6B7280' },
                { key: 'titleSize', label: '标题字号（px）', type: 'number', placeholder: '14' },
                { key: 'valueColor', label: '数值颜色', type: 'text', placeholder: '#4F46E5' },
            ]
        case 'ChartView':
            return [
                { key: 'chartTitle', label: '图表标题', type: 'text', placeholder: '图表标题' },
                { key: 'chartType', label: '图表类型', type: 'select', options: CHART_TYPE_OPTIONS },
                { key: 'xField', label: 'X 轴字段', type: 'select', options: fieldOptions },
                { key: 'yField', label: 'Y 轴字段', type: 'select', options: fieldOptions },
            ]
        case 'LoginForm':
            return [
                { key: 'title', label: '登录标题', type: 'text', placeholder: '系统名称' },
                { key: 'footer', label: '底部说明', type: 'text', placeholder: '请联系管理员获取密码' },
            ]
        case 'Timeline':
            return [
                { key: 'maxItems', label: '最多显示条数', type: 'number', placeholder: '20' },
            ]
        case 'SearchBar':
            return [
                { key: 'placeholder', label: '搜索框占位文字', type: 'text', placeholder: '搜索记录...' },
            ]
        case 'RichTextEditor':
            return [
                { key: 'placeholder', label: '占位文字', type: 'text', placeholder: '在此输入...' },
            ]
        case 'FileUploader':
            return [
                { key: 'hint', label: '上传提示文字', type: 'text', placeholder: '支持图片、PDF...' },
            ]
        default:
            return []
    }
}

interface Props {
    open: boolean
    component: ComponentConfig | null
    page: PageConfig | null
    mode: 'component' | 'page'
    config?: AppConfig
    onSave: (updated: ComponentConfig | PageConfig) => void
    onCancel: () => void
}

export default function ComponentStyleDrawer({
    open, component, page, mode, config, onSave, onCancel
}: Props) {
    const [form] = Form.useForm()

    const fieldOptions = config?.fields.map(f => ({
        label: f.label,
        value: f.name,
    })) ?? []

    const propsSchema = mode === 'component' && component
        ? getPropsSchema(component.type, fieldOptions)
        : []

    useEffect(() => {
        if (!open) return

        if (mode === 'component' && component) {
            form.setFieldsValue({
                span: component.style?.span ?? 24,
                background: component.style?.background ?? '',
                border: component.style?.border ?? '',
                padding: component.style?.padding ?? 0,
                titleColor: component.style?.titleColor ?? '',
                titleSize: component.style?.titleSize ?? 14,
                props: component.props ?? {},
            })
        }

        if (mode === 'page' && page) {
            form.setFieldsValue({
                background: page.style?.background ?? '',
                gap: page.style?.gap ?? 20,
            })
        }
    }, [open, component, page, mode])

    function handleSave() {
        const values = form.getFieldsValue()

        if (mode === 'component' && component) {
            const updated: ComponentConfig = {
                ...component,
                style: {
                    span: values.span || undefined,
                    background: values.background || undefined,
                    border: values.border || undefined,
                    padding: values.padding || undefined,
                    titleColor: values.titleColor || undefined,
                    titleSize: values.titleSize || undefined,
                },
                props: {
                    ...component.props,
                    ...(values.props ?? {}),
                },
            }
            onSave(updated)
        }

        if (mode === 'page' && page) {
            const updated: PageConfig = {
                ...page,
                style: {
                    background: values.background || undefined,
                    gap: values.gap || undefined,
                },
            }
            onSave(updated)
        }
    }

    return (
        <Drawer
            title={
                mode === 'component'
                    ? `编辑组件：${component?.title ?? component?.type}`
                    : `编辑页面样式：${page?.title}`
            }
            open={open}
            onClose={onCancel}
            width={400}
            keyboard
            maskClosable
            destroyOnClose
            footer={
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <Button onClick={onCancel}>取消</Button>
                    <Button type="primary" onClick={handleSave}>保存</Button>
                </div>
            }
        >
            <Form form={form} layout="vertical">

                {/* ── 组件专属：栅格宽度 ── */}
                {mode === 'component' && (
                    <Form.Item label="栅格宽度" name="span">
                        <Select options={SPAN_OPTIONS} />
                    </Form.Item>
                )}

                {/* ── 页面专属：组件间距 ── */}
                {mode === 'page' && (
                    <Form.Item label="组件间距（px）" name="gap">
                        <Slider
                            min={0} max={48} step={4}
                            marks={{ 0: '0', 16: '16', 32: '32', 48: '48' }}
                        />
                    </Form.Item>
                )}

                {/* ── 背景色 ── */}
                <Form.Item
                    label="背景色"
                    name="background"
                    extra="支持颜色名或十六进制，如 #ffffff"
                >
                    <Input placeholder="#ffffff" />
                </Form.Item>

                {/* ── 组件专属：边框、内边距、标题样式 ── */}
                {mode === 'component' && (
                    <>
                        <Form.Item
                            label="边框"
                            name="border"
                            extra="如：1px solid #E5E7EB"
                        >
                            <Input placeholder="1px solid #E5E7EB" />
                        </Form.Item>

                        <Form.Item label="内边距（px）" name="padding">
                            <Slider
                                min={0} max={48} step={4}
                                marks={{ 0: '0', 16: '16', 32: '32', 48: '48' }}
                            />
                        </Form.Item>

                        <Divider style={{ margin: '8px 0' }} />

                        <Form.Item label="标题颜色" name="titleColor">
                            <Input placeholder="#111827" />
                        </Form.Item>

                        <Form.Item label="标题字号（px）" name="titleSize">
                            <Slider
                                min={12} max={24} step={1}
                                marks={{ 12: '12', 16: '16', 20: '20', 24: '24' }}
                            />
                        </Form.Item>
                    </>
                )}

                {/* ── 组件内部属性 ── */}
                {propsSchema.length > 0 && (
                    <>
                        <Divider style={{ margin: '8px 0' }}>组件属性</Divider>
                        {propsSchema.map(schema => (
                            <Form.Item
                                key={schema.key}
                                label={schema.label}
                                name={['props', schema.key]}
                                valuePropName={schema.type === 'switch' ? 'checked' : 'value'}
                            >
                                {schema.type === 'text' && (
                                    <Input placeholder={schema.placeholder} />
                                )}
                                {schema.type === 'number' && (
                                    <InputNumber
                                        style={{ width: '100%' }}
                                        placeholder={schema.placeholder}
                                    />
                                )}
                                {schema.type === 'switch' && (
                                    <Switch />
                                )}
                                {schema.type === 'select' && (
                                    <Select options={schema.options} />
                                )}
                            </Form.Item>
                        ))}
                    </>
                )}

            </Form>
        </Drawer>
    )
}