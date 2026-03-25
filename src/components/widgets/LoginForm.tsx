import { Card, Form, Input, Button, Typography, Divider, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import type { WidgetProps } from './types'

const { Title, Text } = Typography

export default function LoginFormWidget({ config, props, onLogin }: WidgetProps) {
    const [form] = Form.useForm()

    function handleSubmit(values: { username: string; password: string }) {
        if (!onLogin) {
            message.warning('登录功能未配置')
            return
        }

        const ok = onLogin(values.password, values.username)
        if (!ok) {
            message.error('密码错误，请重试')
            form.resetFields(['password'])
        }
    }

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '60vh',
        }}>
            <Card style={{ width: 420, borderRadius: 12 }}>

                {/* 标题 */}
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>🧬</div>
                    <Title level={4} style={{ margin: 0 }}>
                        {props?.title as string ?? config.name}
                    </Title>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                        请登录以继续使用
                    </Text>
                </div>

                {/* 表单 */}
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    autoComplete="off"
                >
                    <Form.Item
                        name="username"
                        rules={[{ required: true, message: '请输入你的姓名' }]}
                    >
                        <Input
                            prefix={<UserOutlined style={{ color: '#9CA3AF' }} />}
                            placeholder="姓名（用于记录操作者）"
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: '请输入访问密码' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined style={{ color: '#9CA3AF' }} />}
                            placeholder="实验室访问密码"
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            block
                            size="large"
                            style={{ borderRadius: 8 }}
                        >
                            进入系统
                        </Button>
                    </Form.Item>
                </Form>

                <Divider />

                <Text
                    type="secondary"
                    style={{ fontSize: 12, display: 'block', textAlign: 'center' }}
                >
                    {props?.footer as string ?? '请联系实验室管理员获取访问密码'}
                </Text>

            </Card>
        </div>
    )
}