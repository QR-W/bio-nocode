import { Card, Typography } from 'antd'
import FormRenderer from '../runner/FormRenderer'
import type { WidgetProps } from './types'

const { Title, Text } = Typography

export default function DataFormWidget({ config, onSubmit, props }: WidgetProps) {
    const submitText = props?.submitText as string | undefined

    return (
        <Card style={{ maxWidth: 680 }}>
            {props?.title != null && String(props.title) !== '' ? (
                <Title level={5} style={{ marginBottom: 4 }}>
                    {String(props.title)}
                </Title>
            ) : null}
            <Text type="secondary" style={{ display: 'block', marginBottom: 20, fontSize: 13 }}>
                带 * 为必填项
            </Text>
            <FormRenderer
                fields={config.fields}
                onSubmit={(values) => onSubmit ? onSubmit(values) : Promise.resolve()}
                loading={false}
                submitText={submitText}   // ← 传入自定义按钮文字
            />
        </Card>
    )
}