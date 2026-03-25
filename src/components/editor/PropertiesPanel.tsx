import { useEffect } from 'react'
import {
    Form, Input, InputNumber, Select,
    Slider, Switch, Typography, Divider,
    Button, Empty, Tabs,
} from 'antd'
import type {
    AppConfig, ComponentConfig, PageConfig,
    FieldDef, FieldInputStyle,
} from '../../types/AppConfig'
import { useEditorStore } from './useEditorStore'

const { Text, Title } = Typography

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

interface Props {
    config: AppConfig
    onConfigChange: (config: AppConfig) => void
}

export default function PropertiesPanel({ config, onConfigChange }: Props) {
    const {
        selectionType, selectedPage,
        selectedComponent, selectedField,
    } = useEditorStore()

    const [form] = Form.useForm()

    // 选中变化时重置表单
    useEffect(() => {
        if (selectionType === 'page' && selectedPage) {
            form.setFieldsValue({
                background: selectedPage.style?.background ?? '',
                gap: selectedPage.style?.gap ?? 20,
            })
        }
        if (selectionType === 'component' && selectedComponent) {
            form.setFieldsValue({
                span: selectedComponent.style?.span ?? 24,
                background: selectedComponent.style?.background ?? '',
                border: selectedComponent.style?.border ?? '',
                padding: selectedComponent.style?.padding ?? 0,
                titleColor: selectedComponent.style?.titleColor ?? '',
                titleSize: selectedComponent.style?.titleSize ?? 14,
                props: selectedComponent.props ?? {},
            })
        }
        if (selectionType === 'field' && selectedField) {
            form.setFieldsValue({
                label: selectedField.label,
                required: selectedField.required ?? false,
                unit: selectedField.unit ?? '',
                helpText: selectedField.helpText ?? '',
                inputStyle: {
                    width: selectedField.inputStyle?.width ?? 100,
                    borderColor: selectedField.inputStyle?.borderColor ?? '',
                    borderRadius: selectedField.inputStyle?.borderRadius ?? 6,
                    borderWidth: selectedField.inputStyle?.borderWidth ?? 1,
                    background: selectedField.inputStyle?.background ?? '',
                    fontSize: selectedField.inputStyle?.fontSize ?? 14,
                    color: selectedField.inputStyle?.color ?? '',
                    padding: selectedField.inputStyle?.padding ?? 0,
                    rows: selectedField.inputStyle?.rows ?? 3,
                },
            })
        }
    }, [selectionType, selectedPage, selectedComponent, selectedField])

    // 实时应用变化
    function handleValuesChange() {
        const values = form.getFieldsValue()
        applyChanges(values)
    }

    function applyChanges(values: Record<string, unknown>) {
        if (selectionType === 'page' && selectedPage) {
            const newPages = config.pages.map(p =>
                p.key === selectedPage.key
                    ? { ...p, style: { background: values.background as string || undefined, gap: values.gap as number || undefined } }
                    : p
            )
            onConfigChange({ ...config, pages: newPages })
        }

        if (selectionType === 'component' && selectedComponent && selectedPage) {
            const updatedComp: ComponentConfig = {
                ...selectedComponent,
                style: {
                    span: (values.span as number) || undefined,
                    background: (values.background as string) || undefined,
                    border: (values.border as string) || undefined,
                    padding: (values.padding as number) || undefined,
                    titleColor: (values.titleColor as string) || undefined,
                    titleSize: (values.titleSize as number) || undefined,
                },
                props: {
                    ...selectedComponent.props,
                    ...((values.props as Record<string, unknown>) ?? {}),
                },
            }
            const newPages = config.pages.map(p =>
                p.key === selectedPage.key
                    ? { ...p, components: p.components.map(c => c.id === selectedComponent.id ? updatedComp : c) }
                    : p
            )
            onConfigChange({ ...config, pages: newPages })
        }

        if (selectionType === 'field' && selectedField) {
            const inputStyle = (values.inputStyle as Record<string, unknown>) ?? {}
            const updatedField: FieldDef = {
                ...selectedField,
                label: (values.label as string) || selectedField.label,
                required: (values.required as boolean) ?? selectedField.required,
                unit: (values.unit as string) || undefined,
                helpText: (values.helpText as string) || undefined,
                inputStyle: Object.fromEntries(
                    Object.entries(inputStyle).filter(([, v]) => v !== undefined && v !== '')
                ) as FieldInputStyle,
            }
            const newFields = config.fields.map(f =>
                f.name === selectedField.name ? updatedField : f
            )
            onConfigChange({ ...config, fields: newFields })
        }
    }

    const fieldOptions = config.fields.map(f => ({ label: f.label, value: f.name }))

    // 根据组件类型返回属性配置项
    function renderComponentProps() {
        if (!selectedComponent) return null

        const type = selectedComponent.type
        const items: React.ReactNode[] = []

        if (type === 'DataForm') {
            items.push(
                <Form.Item key="submitText" label="提交按钮文字" name={['props', 'submitText']}>
                    <Input placeholder="提交记录" />
                </Form.Item>
            )
        }
        if (type === 'DataTable') {
            items.push(
                <Form.Item key="pageSize" label="每页显示条数" name={['props', 'pageSize']}>
                    <InputNumber style={{ width: '100%' }} placeholder="10" />
                </Form.Item>,
                <Form.Item key="showExport" label="显示导出按钮" name={['props', 'showExport']} valuePropName="checked">
                    <Switch />
                </Form.Item>,
                <Form.Item key="showSearch" label="显示内部搜索栏" name={['props', 'showSearch']} valuePropName="checked">
                    <Switch />
                </Form.Item>
            )
        }
        if (type === 'StatsCards') {
            items.push(
                <Form.Item key="showTotal" label="显示总记录数" name={['props', 'showTotal']} valuePropName="checked"><Switch /></Form.Item>,
                <Form.Item key="showThisMonth" label="显示本月新增" name={['props', 'showThisMonth']} valuePropName="checked"><Switch /></Form.Item>,
                <Form.Item key="showFields" label="显示字段数量" name={['props', 'showFields']} valuePropName="checked"><Switch /></Form.Item>,
                <Form.Item key="showLastDate" label="显示最近录入" name={['props', 'showLastDate']} valuePropName="checked"><Switch /></Form.Item>,
                <Form.Item key="cardBackground" label="子卡片背景色" name={['props', 'cardBackground']}><Input placeholder="#ffffff" /></Form.Item>,
                <Form.Item key="titleColor" label="标题颜色" name={['props', 'titleColor']}    ><Input placeholder="#6B7280" /></Form.Item>,
                <Form.Item key="titleSize" label="标题字号（px）" name={['props', 'titleSize']}   ><InputNumber style={{ width: '100%' }} /></Form.Item>,
                <Form.Item key="valueColor" label="数值颜色" name={['props', 'valueColor']}    ><Input placeholder="#4F46E5" /></Form.Item>,
            )
        }
        if (type === 'ChartView') {
            items.push(
                <Form.Item key="chartTitle" label="图表标题" name={['props', 'chartTitle']}><Input placeholder="图表标题" /></Form.Item>,
                <Form.Item key="chartType" label="图表类型" name={['props', 'chartType']}><Select options={CHART_TYPE_OPTIONS} /></Form.Item>,
                <Form.Item key="xField" label="X 轴字段" name={['props', 'xField']}><Select options={fieldOptions} /></Form.Item>,
                <Form.Item key="yField" label="Y 轴字段" name={['props', 'yField']}><Select options={fieldOptions} /></Form.Item>,
            )
        }
        if (type === 'LoginForm') {
            items.push(
                <Form.Item key="title" label="登录标题" name={['props', 'title']} ><Input placeholder="系统名称" /></Form.Item>,
                <Form.Item key="footer" label="底部说明" name={['props', 'footer']}><Input placeholder="请联系管理员获取密码" /></Form.Item>,
            )
        }
        if (type === 'Timeline') {
            items.push(
                <Form.Item key="maxItems" label="最多显示条数" name={['props', 'maxItems']}>
                    <InputNumber style={{ width: '100%' }} placeholder="20" />
                </Form.Item>
            )
        }
        if (type === 'SearchBar') {
            items.push(
                <Form.Item key="placeholder" label="搜索框占位文字" name={['props', 'placeholder']}>
                    <Input placeholder="搜索记录..." />
                </Form.Item>
            )
        }
        if (type === 'RichTextEditor') {
            items.push(
                <Form.Item key="placeholder" label="占位文字" name={['props', 'placeholder']}>
                    <Input placeholder="在此输入..." />
                </Form.Item>
            )
        }
        if (type === 'FileUploader') {
            items.push(
                <Form.Item key="hint" label="上传提示文字" name={['props', 'hint']}>
                    <Input placeholder="支持图片、PDF..." />
                </Form.Item>
            )
        }

        return items.length > 0 ? (
            <>
                <Divider style={{ margin: '8px 0' }}>组件属性</Divider>
                {items}
            </>
        ) : null
    }

    if (!selectionType) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                flexDirection: 'column',
                gap: 8,
            }}>
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="点击预览区的组件或字段开始编辑"
                />
            </div>
        )
    }

    return (
        <div style={{
            height: '100%',
            overflowY: 'auto',
            padding: '16px',
        }}>
            <Title level={5} style={{ marginBottom: 16 }}>
                {selectionType === 'page' && `页面：${selectedPage?.title}`}
                {selectionType === 'component' && `组件：${selectedComponent?.title ?? selectedComponent?.type}`}
                {selectionType === 'field' && `字段：${selectedField?.label}`}
            </Title>

            <Form
                form={form}
                layout="vertical"
                onValuesChange={handleValuesChange}
            >

                {/* ── 页面属性 ── */}
                {selectionType === 'page' && (
                    <>
                        <Form.Item label="页面背景色" name="background">
                            <Input placeholder="#F8F7FF" />
                        </Form.Item>
                        <Form.Item label="组件间距（px）" name="gap">
                            <Slider min={0} max={48} step={4} marks={{ 0: '0', 16: '16', 32: '32', 48: '48' }} />
                        </Form.Item>
                    </>
                )}

                {/* ── 组件属性 ── */}
                {selectionType === 'component' && (
                    <>
                        <Divider style={{ margin: '4px 0 12px' }}>布局</Divider>
                        <Form.Item label="栅格宽度" name="span">
                            <Select options={SPAN_OPTIONS} />
                        </Form.Item>

                        <Divider style={{ margin: '8px 0' }}>样式</Divider>
                        <Form.Item label="背景色" name="background">
                            <Input placeholder="#ffffff" />
                        </Form.Item>
                        <Form.Item label="边框" name="border" extra="如：1px solid #E5E7EB">
                            <Input placeholder="1px solid #E5E7EB" />
                        </Form.Item>
                        <Form.Item label="内边距（px）" name="padding">
                            <Slider min={0} max={48} step={4} marks={{ 0: '0', 16: '16', 32: '32', 48: '48' }} />
                        </Form.Item>
                        <Form.Item label="标题颜色" name="titleColor">
                            <Input placeholder="#111827" />
                        </Form.Item>
                        <Form.Item label="标题字号（px）" name="titleSize">
                            <Slider min={12} max={24} step={1} marks={{ 12: '12', 16: '16', 20: '20', 24: '24' }} />
                        </Form.Item>

                        {renderComponentProps()}
                    </>
                )}

                {/* ── 字段属性 ── */}
                {selectionType === 'field' && (
                    <>
                        <Form.Item label="字段名称" name="label">
                            <Input />
                        </Form.Item>
                        <Form.Item label="是否必填" name="required" valuePropName="checked">
                            <Switch />
                        </Form.Item>
                        <Form.Item label="单位" name="unit">
                            <Input placeholder="如：%、天" />
                        </Form.Item>
                        <Form.Item label="字段说明" name="helpText">
                            <Input.TextArea rows={2} />
                        </Form.Item>

                        <Divider style={{ margin: '8px 0' }}>输入框样式</Divider>
                        <Form.Item label="宽度（%）" name={['inputStyle', 'width']}>
                            <Slider min={25} max={100} step={25} marks={{ 25: '25%', 50: '50%', 75: '75%', 100: '100%' }} />
                        </Form.Item>
                        <Form.Item label="边框颜色" name={['inputStyle', 'borderColor']}>
                            <Input placeholder="#d9d9d9" />
                        </Form.Item>
                        <Form.Item label="边框粗细（px）" name={['inputStyle', 'borderWidth']}>
                            <Slider min={1} max={4} step={1} marks={{ 1: '1', 2: '2', 3: '3', 4: '4' }} />
                        </Form.Item>
                        <Form.Item label="圆角（px）" name={['inputStyle', 'borderRadius']}>
                            <Slider min={0} max={20} step={2} marks={{ 0: '0', 8: '8', 16: '16', 20: '20' }} />
                        </Form.Item>
                        <Form.Item label="背景色" name={['inputStyle', 'background']}>
                            <Input placeholder="#ffffff" />
                        </Form.Item>
                        <Form.Item label="字体大小（px）" name={['inputStyle', 'fontSize']}>
                            <Slider min={12} max={20} step={1} marks={{ 12: '12', 14: '14', 16: '16', 20: '20' }} />
                        </Form.Item>
                        <Form.Item label="字体颜色" name={['inputStyle', 'color']}>
                            <Input placeholder="#374151" />
                        </Form.Item>
                        <Form.Item label="内边距（px）" name={['inputStyle', 'padding']}>
                            <Slider min={0} max={24} step={4} marks={{ 0: '0', 8: '8', 16: '16', 24: '24' }} />
                        </Form.Item>
                        {selectedField?.type === 'textarea' && (
                            <Form.Item label="文本框行数" name={['inputStyle', 'rows']}>
                                <Slider min={2} max={10} step={1} marks={{ 2: '2', 4: '4', 6: '6', 10: '10' }} />
                            </Form.Item>
                        )}
                    </>
                )}

            </Form>
        </div>
    )
}