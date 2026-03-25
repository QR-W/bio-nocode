import { Card, Typography } from 'antd'
import FormRenderer from './FormRenderer'
import type { FieldDef } from '../../types/AppConfig'

const { Title, Text } = Typography

interface Props {
    fields: FieldDef[]
    onSubmit: (values: Record<string, unknown>) => void
    loading: boolean
}

export default function FormPanel({ fields, onSubmit, loading }: Props) {
    return (
        <Card style={{ maxWidth: 680 }}>
            <Title level={5} style={{ marginBottom: 4 }}>填写实验记录</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 20, fontSize: 13 }}>
                请如实填写实验数据，带 * 为必填项
            </Text>
            <FormRenderer
                fields={fields}
                onSubmit={onSubmit}
                loading={loading}
            />
        </Card>
    )
}