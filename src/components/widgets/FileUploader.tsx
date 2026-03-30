import { Card, Upload, Typography } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import type { WidgetProps } from './types'

const { Title, Text, Paragraph } = Typography

export default function FileUploaderWidget({ props }: WidgetProps) {
    return (
        <Card>
            {props?.title != null && String(props.title) !== '' ? (
                <Title level={5} style={{ marginBottom: 12 }}>{String(props.title)}</Title>
            ) : null}
            <Upload.Dragger
                beforeUpload={() => false}
                multiple
                style={{ borderRadius: 8 }}
            >
                <p className="ant-upload-drag-icon">
                    <InboxOutlined style={{ fontSize: 48, color: '#4F46E5' }} />
                </p>
                <Paragraph style={{ margin: 0 }}>
                    点击或拖拽文件到此处上传
                </Paragraph>
                <Text type="secondary" style={{ fontSize: 12 }}>
                    {String(props?.hint ?? '支持图片、PDF、Excel 等格式')}
                </Text>
            </Upload.Dragger>
        </Card>
    )
}