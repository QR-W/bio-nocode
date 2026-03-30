import { useEffect, useState } from 'react'
import {
  Layout, Typography, Button, Card, Row, Col,
  Spin, Tag, Popconfirm, message,
  Input, Tooltip
} from 'antd'
import {
  SettingOutlined, EditOutlined,
  DeleteOutlined, SendOutlined, LogoutOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { appRepo } from '../services/db/appRepo'
import { useAuthStore } from '../stores/authStore'
import type { AppConfig, ExperimentType } from '../types/AppConfig'

const { Header, Content } = Layout
const { Title, Text } = Typography

const EXPERIMENT_TYPE_LABELS: Record<string, string> = {
  passage: '传代培养',
  cryopreservation: '冻存与复苏',
  transfection: '转染实验',
  flow_cytometry: '流式细胞术',
  drug_assay: '药物活性检测',
  project: '课题管理',
}

const TEMPLATE_OPTIONS: {
  type: ExperimentType
  label: string
  desc: string
  emoji: string
}[] = [
    { type: 'passage', label: '传代培养', desc: '传代次数、活率、融合度记录', emoji: '🔬' },
    { type: 'cryopreservation', label: '冻存与复苏', desc: '冻存条件、复苏活率追踪', emoji: '🧊' },
    { type: 'transfection', label: '转染实验', desc: '转染效率、质粒用量记录', emoji: '🧬' },
    { type: 'flow_cytometry', label: '流式细胞术', desc: '阳性细胞比例、检测指标', emoji: '📊' },
    { type: 'drug_assay', label: '药物活性检测', desc: 'CCK-8、MTT 吸光度与活力', emoji: '💊' },
    { type: 'project', label: '课题管理', desc: '长期实验进度与结果追踪', emoji: '📋' },
  ]

export default function HomePage() {
  const navigate = useNavigate()
  const logout = useAuthStore(s => s.logout)
  const currentUser = useAuthStore(s => s.currentUser)

  const [apps, setApps] = useState<AppConfig[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')

  useEffect(() => { loadApps() }, [])

  async function loadApps() {
    setLoading(true)
    try {
      const list = await appRepo.listAll()
      setApps(list)
      const countMap: Record<string, number> = {}
      await Promise.all(list.map(async app => {
        countMap[app.id] = await appRepo.countRecords(app.id)
      }))
      setCounts(countMap)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    await appRepo.delete(id)
    message.success('已删除')
    loadApps()
  }

  function handleSend() {
    const text = input.trim()
    if (!text) return
    sessionStorage.setItem('builderInitMsg', text)
    navigate('/builder?hasInit=1')
  }

  function handleTemplate(type: ExperimentType) {
    navigate(`/builder?type=${type}`)
  }

  function handleLogout() {
    logout()
    navigate('/auth')
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#F8F7FF' }}>
      <Header style={{
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
      }}>
        <Title level={4} style={{ margin: 0, color: '#4F46E5' }}>
          🧬 BioForm
        </Title>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {currentUser?.username}
          </Text>
          <Button
            icon={<SettingOutlined />}
            type="text"
            onClick={() => navigate('/settings')}
          >
            设置
          </Button>
          <Button
            icon={<LogoutOutlined />}
            type="text"
            onClick={handleLogout}
          >
            退出
          </Button>
        </div>
      </Header>

      <Content style={{ padding: '40px 32px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>

          {/* AI 对话入口 */}
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: '32px',
            marginBottom: 40,
            boxShadow: '0 2px 12px rgba(79,70,229,0.08)',
            border: '1px solid #EEEDF5',
          }}>
            <Title level={3} style={{ margin: '0 0 4px' }}>
              你需要管理什么实验数据？
            </Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
              用自然语言描述你的需求，AI 会自动生成专属的数据管理系统
            </Text>
            <div style={{ display: 'flex', gap: 8 }}>
              <Input
                size="large"
                value={input}
                onChange={e => setInput(e.target.value)}
                onPressEnter={handleSend}
                placeholder="例如：我需要记录 HeLa 细胞的传代数据，包括活率和融合度"
                style={{ borderRadius: 10 }}
              />
              <Button
                type="primary"
                size="large"
                icon={<SendOutlined />}
                onClick={handleSend}
                disabled={!input.trim()}
                style={{ borderRadius: 10, minWidth: 80 }}
              >
                生成
              </Button>
            </div>
          </div>

          {/* 模板快速创建 */}
          <div style={{ marginBottom: 32 }}>
            <Text strong style={{ fontSize: 15 }}>或从模板快速开始</Text>
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              {TEMPLATE_OPTIONS.map(opt => (
                <Col span={8} key={opt.type}>
                  <Card
                    hoverable
                    onClick={() => handleTemplate(opt.type)}
                    style={{ cursor: 'pointer', borderRadius: 12 }}
                    styles={{ body: { padding: '20px 24px' } }}
                  >
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{opt.emoji}</div>
                    <Text strong style={{ fontSize: 15 }}>{opt.label}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>{opt.desc}</Text>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>

          {/* 已有应用列表 */}
          {(loading || apps.length > 0) && (
            <>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}>
                <Text strong style={{ fontSize: 15 }}>我的应用</Text>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <Spin size="large" />
                </div>
              ) : (
                <Row gutter={[20, 20]}>
                  {apps.map(app => (
                    <Col span={8} key={app.id}>
                      <Card
                        hoverable
                        onClick={() => navigate(`/app/${app.id}`)}
                        style={{ cursor: 'pointer', borderRadius: 12 }}
                        actions={[
                          <Tooltip key="edit" title="迭代修改">
                            <EditOutlined
                              onClick={e => {
                                e.stopPropagation()
                                navigate(`/builder/${app.id}`)
                              }}
                            />
                          </Tooltip>,
                          <Popconfirm
                            key="delete"
                            title="确认删除这个应用及其所有数据？"
                            onConfirm={e => {
                              e?.stopPropagation()
                              handleDelete(app.id)
                            }}
                            onCancel={e => e?.stopPropagation()}
                            okText="删除"
                            cancelText="取消"
                            okButtonProps={{ danger: true }}
                          >
                            <DeleteOutlined
                              style={{ color: '#ff4d4f' }}
                              onClick={e => e.stopPropagation()}
                            />
                          </Popconfirm>,
                        ]}
                      >
                        <Card.Meta
                          title={app.name}
                          description={
                            <Text type="secondary" ellipsis style={{ fontSize: 13 }}>
                              {app.description}
                            </Text>
                          }
                        />
                        <div style={{ marginTop: 12 }}>
                          <Tag color="purple">
                            {EXPERIMENT_TYPE_LABELS[app.experimentType]}
                          </Tag>
                          {app.cellLine && (
                            <Tag color="blue">{app.cellLine}</Tag>
                          )}
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {counts[app.id] ?? 0} 条记录 · v{app.version}
                          </Text>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </>
          )}

        </div>
      </Content>
    </Layout>
  )
}