import { Form, Input, InputNumber, DatePicker, Select, Switch, Upload, Button } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import type { FieldDef } from '../../types/AppConfig'

interface Props {
  fields: FieldDef[]
  onSubmit: (values: Record<string, unknown>) => void
  loading: boolean
  submitText?: string
}

export default function FormRenderer({ fields, onSubmit, submitText, loading }: Props) {
  const [form] = Form.useForm()

  // 安全处理 defaultValue，避免 {label, value} 对象直接作为值
  const initialValues = Object.fromEntries(
    fields.map(f => {
      const val = f.defaultValue
      if (val && typeof val === 'object' && 'value' in (val as object)) {
        return [f.name, (val as { value: unknown }).value]
      }
      return [f.name, val]
    })
  )

  function handleFinish(values: Record<string, unknown>) {
    onSubmit(values)
    form.resetFields()
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      initialValues={initialValues}
    >
      {fields.map(field => (
        <Form.Item
          key={field.name}
          name={field.name}
          label={
            <span>
              {field.label}
              {field.unit && (
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 4 }}>
                  ({field.unit})
                </span>
              )}
            </span>
          }
          rules={[
            {
              required: field.required,
              message: `请填写${field.label}`,
            },
            ...(field.validation?.min !== undefined ? [{
              type: 'number' as const,
              min: field.validation.min,
              message: `最小值为 ${field.validation.min}`,
            }] : []),
            ...(field.validation?.max !== undefined ? [{
              type: 'number' as const,
              max: field.validation.max,
              message: `最大值为 ${field.validation.max}`,
            }] : []),
          ]}
          style={{
            width: field.inputStyle?.width
              ? `${field.inputStyle.width}%`
              : '100%',
            display: 'inline-block',
            paddingRight: field.inputStyle?.width && field.inputStyle.width < 100 ? 12 : 0,
          }}
          extra={field.helpText}
        >
          {renderField(field)}
        </Form.Item>
      ))}

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>
          {submitText ?? '提交记录'}
        </Button>
      </Form.Item>
    </Form>
  )
}

function renderField(field: FieldDef) {
  const s = field.inputStyle ?? {}

  const inputStyle: React.CSSProperties = {
    borderColor: s.borderColor,
    borderRadius: s.borderRadius,
    borderWidth: s.borderWidth,
    background: s.background,
    fontSize: s.fontSize,
    color: s.color,
    padding: s.padding,
    width: s.width ? `${s.width}%` : '100%',
  }

  switch (field.type) {
    case 'text':
      return <Input style={inputStyle} placeholder={field.placeholder} />

    case 'textarea':
      return (
        <Input.TextArea
          style={inputStyle}
          rows={s.rows ?? 3}
          placeholder={field.placeholder}
        />
      )

    case 'number':
      return (
        <InputNumber
          style={{ ...inputStyle, width: s.width ? `${s.width}%` : '100%' }}
          placeholder={field.placeholder}
          min={field.validation?.min}
          max={field.validation?.max}
        />
      )

    case 'date':
      return <DatePicker style={inputStyle} />

    case 'select':
      return (
        <Select
          style={inputStyle}
          placeholder={field.placeholder ?? `请选择${field.label}`}
          options={field.options?.map(o =>
            typeof o === 'object' && 'value' in o
              ? o as { label: string; value: string }
              : { label: String(o), value: String(o) }
          )}
        />
      )

    case 'multiselect':
      return (
        <Select
          mode="multiple"
          style={inputStyle}
          placeholder={field.placeholder ?? `请选择${field.label}`}
          options={field.options?.map(o =>
            typeof o === 'object' && 'value' in o
              ? o as { label: string; value: string }
              : { label: String(o), value: String(o) }
          )}
        />
      )

    case 'boolean':
      return <Switch />

    case 'file':
      return (
        <Upload beforeUpload={() => false} maxCount={1}>
          <Button icon={<UploadOutlined />}>选择文件</Button>
        </Upload>
      )

    default:
      return <Input style={inputStyle} placeholder={field.placeholder} />
  }
}