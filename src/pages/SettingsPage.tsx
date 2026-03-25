import { Layout, Typography, Form, Input, Select, Button, Card, Alert, message } from 'antd'
import { ArrowLeftOutlined, SaveOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useSettingsStore, SUPPORTED_MODELS } from '../stores/settingsStore'

const { Header, Content } = Layout
const { Title, Text } = Typography

export default function SettingsPage() {
  const navigate = useNavigate()
  const { apiKey, model, baseURL, setApiKey, setModel, setBaseURL } = useSettingsStore()
  const [form] = Form.useForm()

  function handleSave(values: { apiKey: string; model: string; baseURL: string }) {
    setApiKey(values.apiKey)
    setModel(values.model)
    setBaseURL(values.baseURL ?? '')
    message.success('设置已保存')
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#F8F7FF' }}>
      <Header style={{
        background:   '#fff',
        borderBottom: '1px solid #f0f0f0',
        display:      'flex',
        alignItems:   'center',
        gap:          12,
        padding:      '0 24px',
      }}>
        <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate('/')} />
        <Text strong style={{ fontSize: 16 }}>设置</Text>
      </Header>

      <Content style={{ padding: '40px 24px' }}>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <Title level={4}>API 配置</Title>

          <Alert
            type="info"
            showIcon
            message="隐私说明"
            description="API Key 仅保存在你的浏览器本地，不会上传到任何服务器。"
            style={{ marginBottom: 24 }}
          />

          <Card>
            <Form
              form={form}
              layout="vertical"
              initialValues={{ apiKey, model, baseURL }}
              onFinish={handleSave}
            >
              <Form.Item
                label="API Key"
                name="apiKey"
                rules={[{ required: true, message: '请填写 API Key' }]}
              >
                <Input.Password
                  placeholder="sk-..."
                  iconRender={visible =>
                    visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                  }
                />
              </Form.Item>

              <Form.Item label="模型" name="model">
                <Select options={SUPPORTED_MODELS} />
              </Form.Item>

              <Form.Item
                label="Base URL（可选）"
                name="baseURL"
                extra="留空使用默认地址。使用 DeepSeek 等兼容服务时会自动填入。"
              >
                <Input placeholder="https://api.openai.com/v1" />
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