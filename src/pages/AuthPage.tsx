import { useState } from 'react'
import { Card, Form, Input, Button, Typography, Tabs, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { userRepo } from '../services/db/userRepo'
import { useAuthStore } from '../stores/authStore'

const { Title, Text } = Typography

export default function AuthPage() {
    const navigate = useNavigate()
    const setUser = useAuthStore(s => s.setUser)
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
    const [form] = Form.useForm()

    async function handleLogin(values: { username: string; password: string }) {
        setLoading(true)
        try {
            const user = await userRepo.login(values.username, values.password)
            setUser(user)
            message.success(`欢迎回来，${user.username}`)
            navigate('/')
        } catch (err) {
            message.error(err instanceof Error ? err.message : '登录失败')
        } finally {
            setLoading(false)
        }
    }

    async function handleRegister(values: { username: string; password: string }) {
        setLoading(true)
        try {
            const user = await userRepo.register(values.username, values.password)
            setUser(user)
            message.success('注册成功，已自动登录')
            navigate('/')
        } catch (err) {
            message.error(err instanceof Error ? err.message : '注册失败')
        } finally {
            setLoading(false)
        }
    }

    const formContent = (onFinish: (v: any) => void) => (
        <Form form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item
                name="username"
                rules={[{ required: true, message: '请输入用户名' }]}
            >
                <Input
                    prefix={<UserOutlined />}
                    placeholder="用户名"
                    size="large"
                />
            </Form.Item>
            <Form.Item
                name="password"
                rules={[{ required: true, message: '请输入密码' }]}
            >
                <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="密码"
                    size="large"
                />
            </Form.Item>
            <Button
                type="primary" htmlType="submit"
                block size="large" loading={loading}
            >
                确认
            </Button>
        </Form>
    )

    return (
        <div style={{
            minHeight: '100vh',
            background: '#F8F7FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <Card style={{ width: 420, borderRadius: 16 }}>
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <Title level={3} style={{ margin: 0, color: '#4F46E5' }}>
                        BioZeroCodeForm
                    </Title>
                    <Text type="secondary">基于LLM的细胞生物学实验零代码平台</Text>
                </div>

                <Tabs
                    centered
                    activeKey={activeTab}
                    onChange={(key) => {
                        setActiveTab(key as 'login' | 'register')
                        form.resetFields()
                    }}
                    items={[
                        {
                            key: 'login',
                            label: '登录',
                        },
                        {
                            key: 'register',
                            label: '注册',
                        },
                    ]}
                />
                {formContent(activeTab === 'login' ? handleLogin : handleRegister)}
            </Card>
        </div>
    )
}