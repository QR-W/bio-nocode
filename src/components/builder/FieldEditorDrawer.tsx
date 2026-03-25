import { useEffect } from 'react'
import {
  Drawer, Form, Input, Select, Switch,
  InputNumber, Space, Button, Typography,
  Divider, Slider,
} from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import type { FieldDef, FieldType, FieldInputStyle } from '../../types/AppConfig'

const { Text } = Typography

const FIELD_TYPE_OPTIONS: { label: string; value: FieldType }[] = [
  { label: '单行文本', value: 'text' },
  { label: '多行文本', value: 'textarea' },
  { label: '数字', value: 'number' },
  { label: '日期', value: 'date' },
  { label: '单选下拉', value: 'select' },
  { label: '多选', value: 'multiselect' },
  { label: '开关（是/否）', value: 'boolean' },
  { label: '文件上传', value: 'file' },
]

interface Props {
  open: boolean
  field: FieldDef | null
  onSave: (field: FieldDef) => void
  onCancel: () => void
}

export default function FieldEditorDrawer({ open, field, onSave, onCancel }: Props) {
  const [form] = Form.useForm()
  const isNew = field === null

  const fieldType = Form.useWatch('type', form)

  useEffect(() => {
    if (open) {
      form.setFieldsValue(
        field ?? {
          name: '',
          label: '',
          type: 'text',
          required: false,
          unit: '',
          options: [],
          validation: { min: undefined, max: undefined },
          helpText: '',
          inputStyle: {
            width: 100,
            borderRadius: 6,
            borderWidth: 1,
            fontSize: 14,
          },
        }
      )
    }
  }, [open, field, form])

  function handleOk() {
    form.validateFields().then(values => {
      const cleaned: FieldDef = {
        name: values.name.trim(),
        label: values.label.trim(),
        type: values.type,
        required: values.required ?? false,
      }

      if (values.unit?.trim()) cleaned.unit = values.unit.trim()
      if (values.helpText?.trim()) cleaned.helpText = values.helpText.trim()

      if (
        (values.type === 'select' || values.type === 'multiselect') &&
        values.options?.length
      ) {
        cleaned.options = values.options.filter((o: string) => o?.trim())
      }

      if (values.type === 'number') {
        const v = values.validation
        if (v?.min !== undefined || v?.max !== undefined) {
          cleaned.validation = {}
          if (v.min !== undefined) cleaned.validation.min = v.min
          if (v.max !== undefined) cleaned.validation.max = v.max
        }
      }

      // 保存输入框样式
      if (values.inputStyle) {
        const style = Object.fromEntries(
          Object.entries(values.inputStyle).filter(([, v]) => v !== undefined && v !== '')
        ) as FieldInputStyle
        if (Object.keys(style).length > 0) {
          cleaned.inputStyle = style
        }
      }

      onSave(cleaned)
    })
  }

  return (
    <Drawer
      title={isNew ? '新增字段' : `编辑字段：${field?.label}`}
      open={open}
      onClose={onCancel}
      width={460}
      destroyOnClose
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" onClick={handleOk}>保存</Button>
        </div>
      }
    >
      <Form form={form} layout="vertical">

        {/* ── 基本信息 ── */}
        <Form.Item
          label="字段名称（中文显示名）"
          name="label"
          rules={[{ required: true, message: '请输入字段名称' }]}
        >
          <Input placeholder="如：细胞活率" />
        </Form.Item>

        <Form.Item
          label={
            <span>
              字段 Key（英文）
              <Text type="secondary" style={{ fontSize: 12, marginLeft: 6 }}>
                用于数据存储，创建后不建议修改
              </Text>
            </span>
          }
          name="name"
          rules={[
            { required: true, message: '请输入字段 Key' },
            {
              pattern: /^[a-z][a-z0-9_]*$/,
              message: '只能包含小写字母、数字和下划线，且以字母开头',
            },
          ]}
        >
          <Input placeholder="如：cell_viability" disabled={!isNew} />
        </Form.Item>

        <Form.Item
          label="字段类型"
          name="type"
          rules={[{ required: true }]}
        >
          <Select options={FIELD_TYPE_OPTIONS} />
        </Form.Item>

        <Form.Item label="是否必填" name="required" valuePropName="checked">
          <Switch />
        </Form.Item>

        {fieldType === 'number' && (
          <Form.Item label="单位" name="unit">
            <Input placeholder="如：%、×10⁶/mL、天、μM" />
          </Form.Item>
        )}

        {fieldType === 'number' && (
          <Form.Item label="数值范围">
            <Space>
              <Form.Item name={['validation', 'min']} noStyle>
                <InputNumber placeholder="最小值" style={{ width: 140 }} />
              </Form.Item>
              <Text type="secondary">~</Text>
              <Form.Item name={['validation', 'max']} noStyle>
                <InputNumber placeholder="最大值" style={{ width: 140 }} />
              </Form.Item>
            </Space>
          </Form.Item>
        )}

        {(fieldType === 'select' || fieldType === 'multiselect') && (
          <Form.Item label="选项列表">
            <Form.List name="options">
              {(fields, { add, remove }) => (
                <>
                  {fields.map((f, idx) => (
                    <Space key={f.key} style={{ display: 'flex', marginBottom: 6 }}>
                      <Form.Item name={[f.name]} noStyle>
                        <Input
                          placeholder={`选项 ${idx + 1}`}
                          style={{ width: 300 }}
                        />
                      </Form.Item>
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(f.name)}
                      />
                    </Space>
                  ))}
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    size="small"
                    onClick={() => add('')}
                  >
                    添加选项
                  </Button>
                </>
              )}
            </Form.List>
          </Form.Item>
        )}

        <Form.Item label="字段说明（可选）" name="helpText">
          <Input.TextArea
            rows={2}
            placeholder="填写后显示在表单字段下方，帮助用户理解该字段含义"
          />
        </Form.Item>

        {/* ── 输入框样式 ── */}
        <Divider style={{ margin: '12px 0' }}>输入框样式</Divider>

        <Form.Item
          label="宽度（占表单列百分比）"
          name={['inputStyle', 'width']}
        >
          <Slider
            min={25} max={100} step={25}
            marks={{ 25: '25%', 50: '50%', 75: '75%', 100: '100%' }}
          />
        </Form.Item>

        <Form.Item label="边框颜色" name={['inputStyle', 'borderColor']}>
          <Input placeholder="#d9d9d9" />
        </Form.Item>

        <Form.Item label="边框粗细（px）" name={['inputStyle', 'borderWidth']}>
          <Slider
            min={1} max={4} step={1}
            marks={{ 1: '1', 2: '2', 3: '3', 4: '4' }}
          />
        </Form.Item>

        <Form.Item label="圆角（px）" name={['inputStyle', 'borderRadius']}>
          <Slider
            min={0} max={20} step={2}
            marks={{ 0: '0', 8: '8', 16: '16', 20: '20' }}
          />
        </Form.Item>

        <Form.Item label="背景色" name={['inputStyle', 'background']}>
          <Input placeholder="#ffffff" />
        </Form.Item>

        <Form.Item label="字体大小（px）" name={['inputStyle', 'fontSize']}>
          <Slider
            min={12} max={20} step={1}
            marks={{ 12: '12', 14: '14', 16: '16', 20: '20' }}
          />
        </Form.Item>

        <Form.Item label="字体颜色" name={['inputStyle', 'color']}>
          <Input placeholder="#374151" />
        </Form.Item>

        <Form.Item label="内边距（px）" name={['inputStyle', 'padding']}>
          <Slider
            min={0} max={24} step={4}
            marks={{ 0: '0', 8: '8', 16: '16', 24: '24' }}
          />
        </Form.Item>

        {fieldType === 'textarea' && (
          <Form.Item label="文本框行数" name={['inputStyle', 'rows']}>
            <Slider
              min={2} max={10} step={1}
              marks={{ 2: '2', 4: '4', 6: '6', 10: '10' }}
            />
          </Form.Item>
        )}

      </Form>
    </Drawer>
  )
}