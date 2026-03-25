import { useState } from 'react'
import { Card, Input, Typography, Button, message } from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import type { WidgetProps } from './types'

const { Title, Text } = Typography

export default function RichTextEditorWidget({ props }: WidgetProps) {
    const [content, setContent] = useState('')
    const [saved, setSaved] = useState(false)

    function handleSave() {
        if (!content.trim()) {
            message.warning('内容不能为空')
            return
        }
        // 毕设阶段存到 localStorage，key 用 title 区分
        const key = `richtext_${String(props?.title ?? 'default')}`
        localStorage.setItem(key, content)
        setSaved(true)
        message.success('已保存')
        setTimeout(() => setSaved(false), 2000)
    }

    // 初始化时从 localStorage 读取
    useState(() => {
        const key = `richtext_${String(props?.title ?? 'default')}`
        const saved = localStorage.getItem(key)
        if (saved) setContent(saved)
    })

    return (
        <Card>
            {props?.title && (
                <Title level={5} style={{ marginBottom: 12 }}>
                    {String(props.title)}
                </Title>
            )}

            <Input.TextArea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder={String(props?.placeholder ?? '在此输入实验记录、备注或报告内容...')}
                rows={12}
                style={{ borderRadius: 8, fontSize: 14, lineHeight: 1.8 }}
            />

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 12,
            }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                    支持自由编辑，点击保存后内容会保留
                </Text>
                <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleSave}
                    size="small"
                >
                    {saved ? '已保存 ✓' : '保存'}
                </Button>
            </div>
        </Card>
    )
}