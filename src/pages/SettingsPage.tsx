import { Layout, Typography, Form, Input, Button, Card, Alert, message } from 'antd'
import { ArrowLeftOutlined, SaveOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useSettingsStore } from '../stores/settingsStore'
import { DEEPSEEK_CHAT_MODEL } from '../services/llm/llmClient'

const { Header, Content } = Layout
const { Title, Text } = Typography

export default function SettingsPage() {
  const navigate = useNavigate()
  const { apiKey, baseURL, setApiKey, setBaseURL } = useSettingsStore()
  const [form] = Form.useForm()

  function handleSave(values: { apiKey: string; baseURL: string }) {
    setApiKey(values.apiKey)
    setBaseURL(values.baseURL?.trim() ?? '')
    message.success('设置已保存')
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#F8F7FF' }}>
      <Header style={{
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 24px',
      }}>
        <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate('/')} />
        <Text strong style={{ fontSize: 16 }}>设置</Text>
      </Header>

      <Content style={{ padding: '40px 24px' }}>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <Title level={4}>DeepSeek API</Title>

          <Alert
            type="info"
            showIcon
            message="当前仅支持 DeepSeek"
            description={
              <>
                生成应用配置统一调用 DeepSeek Chat 接口（模型：<Text code>{DEEPSEEK_CHAT_MODEL}</Text>
                ）。请在{' '}
                <a
                  href="https://platform.deepseek.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  DeepSeek 开放平台
                </a>{' '}
                获取 API Key。Key 仅保存在本机浏览器，不会上传到本平台服务器。
              </>
            }
            style={{ marginBottom: 24 }}
          />

          <Card>
            <Form
              form={form}
              layout="vertical"
              initialValues={{ apiKey, baseURL }}
              onFinish={handleSave}
            >
              <Form.Item
                label="API Key"
                name="apiKey"
                rules={[{ required: true, message: '请填写 DeepSeek API Key' }]}
              >
                <Input.Password
                  placeholder="在 DeepSeek 控制台创建"
                  iconRender={visible =>
                    visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                  }
                />
              </Form.Item>

              <Form.Item
                label="API 根地址（可选）"
                name="baseURL"
                extra="一般留空即可（默认 https://api.deepseek.com）。仅在使用兼容 OpenAI 协议的自建代理时填写。"
              >
                <Input placeholder="https://api.deepseek.com" />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  block
                >
                  保存设置
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
      </Content>
    </Layout>
  )
}
