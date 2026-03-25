import { useEffect, useState } from 'react'
import { Layout, Menu, Typography, Button, Spin, message } from 'antd'
import {
  ArrowLeftOutlined, EditOutlined,
  DashboardOutlined, FormOutlined, TableOutlined,
  BarChartOutlined, UserOutlined, SearchOutlined,
  FileOutlined, UploadOutlined, HistoryOutlined,
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { appRepo } from '../services/db/appRepo'
import { recordRepo } from '../services/db/recordRepo'
import type { AppConfig, DataRecord } from '../types/AppConfig'
import PageRenderer from '../components/engine/PageRenderer'

const { Sider, Header, Content } = Layout
const { Text, Title } = Typography

const ICON_MAP: Record<string, React.ReactNode> = {
  DashboardOutlined: <DashboardOutlined />,
  FormOutlined: <FormOutlined />,
  TableOutlined: <TableOutlined />,
  BarChartOutlined: <BarChartOutlined />,
  UserOutlined: <UserOutlined />,
  SearchOutlined: <SearchOutlined />,
  FileOutlined: <FileOutlined />,
  UploadOutlined: <UploadOutlined />,
  HistoryOutlined: <HistoryOutlined />,
}

export default function AppRunnerPage() {
  const navigate = useNavigate()
  const { appId } = useParams<{ appId: string }>()

  const [app, setApp] = useState<AppConfig | null>(null)
  const [records, setRecords] = useState<DataRecord[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [activeKey, setActiveKey] = useState<string>('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUsername, setCurrentUsername] = useState('')

  useEffect(() => {
    if (appId) loadData(appId)
  }, [appId])

  // 守卫：app 加载完且未登录时，处理放行或跳登录页
  useEffect(() => {
    if (!app || isLoggedIn) return

    const hasLoginPage = app.pages?.some(p =>
      p.components.some(c => c.type === 'LoginForm')
    )
    if (!hasLoginPage || !app.password) {
      handleLoginSuccess()
    }
  }, [app])

  function handleLoginSuccess(username?: string) {
    setIsLoggedIn(true)
    if (app?.id) {
      sessionStorage.setItem(`loggedIn_${app.id}`, 'true')
      if (username) {
        sessionStorage.setItem(`username_${app.id}`, username)
      }
    }
  }

  async function loadData(id: string) {
    setPageLoading(true)
    try {
      const [appData, recordData] = await Promise.all([
        appRepo.getById(id),
        recordRepo.listByApp(id),
      ])
      if (!appData) {
        message.error('应用不存在')
        navigate('/')
        return
      }
      setApp(appData)
      setRecords(recordData)

      const key = `loggedIn_${appData.id}`
      const saved = sessionStorage.getItem(key)

      if (saved === 'true') {
        // 已登录：恢复用户名，跳到第一个非登录页
        const savedUsername = sessionStorage.getItem(`username_${appData.id}`)
        if (savedUsername) setCurrentUsername(savedUsername)
        setIsLoggedIn(true)

        const firstNonLogin = appData.pages?.find(p =>
          !p.components.some(c => c.type === 'LoginForm')
        )
        setActiveKey(firstNonLogin?.key ?? appData.pages?.[0]?.key ?? 'dashboard')
      } else {
        // 未登录：跳到登录页（如果有）
        const loginPage = appData.pages?.find(p =>
          p.components.some(c => c.type === 'LoginForm')
        )
        setActiveKey(loginPage?.key ?? appData.pages?.[0]?.key ?? 'dashboard')
      }

    } finally {
      setPageLoading(false)
    }
  }

  async function handleSubmit(values: Record<string, unknown>) {
    if (!appId) return
    try {
      const record = await recordRepo.create(appId, values)
      setRecords(prev => [record, ...prev])
      message.success('记录已提交')
    } catch {
      message.error('提交失败，请重试')
    }
  }

  async function handleDelete(id: string) {
    await recordRepo.delete(id)
    setRecords(prev => prev.filter(r => r.id !== id))
    message.success('已删除')
  }

  async function handleExport() {
    if (!app) return
    const csv = await recordRepo.exportCSV(app.id, app.fields.map(f => f.name))
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${app.name}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  function handleLogin(password: string, username?: string): boolean {
    if (!app?.password) {
      message.error('该应用尚未设置访问密码，请联系管理员')
      return false
    }
    if (password !== app.password) return false

    handleLoginSuccess(username)
    if (username) setCurrentUsername(username)

    const firstNonLogin = pages.find(p =>
      !p.components.some(c => c.type === 'LoginForm')
    )
    if (firstNonLogin) setActiveKey(firstNonLogin.key)
    return true
  }

  function handleLogout() {
    if (!app?.id) return
    sessionStorage.removeItem(`loggedIn_${app.id}`)
    sessionStorage.removeItem(`username_${app.id}`)
    setIsLoggedIn(false)
    setCurrentUsername('')
    const loginPage = pages.find(p =>
      p.components.some(c => c.type === 'LoginForm')
    )
    if (loginPage) setActiveKey(loginPage.key)
  }

  if (pageLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
      }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!app) return null

  const pages = app.pages?.length ? app.pages : [
    {
      key: 'dashboard',
      title: '概览',
      icon: 'DashboardOutlined',
      components: [{ id: 'stats_1', type: 'StatsCards' as const }],
    },
    {
      key: 'input',
      title: '数据录入',
      icon: 'FormOutlined',
      components: [{ id: 'form_1', type: 'DataForm' as const }],
    },
    {
      key: 'list',
      title: '数据列表',
      icon: 'TableOutlined',
      components: [
        { id: 'search_1', type: 'SearchBar' as const },
        { id: 'table_1', type: 'DataTable' as const },
      ],
    },
    {
      key: 'chart',
      title: '图表分析',
      icon: 'BarChartOutlined',
      components: [{ id: 'chart_1', type: 'ChartView' as const }],
    },
  ]

  const currentPage = pages.find(p => p.key === activeKey) ?? pages[0]

  const menuItems = pages
    .filter(page => !page.components.some(c => c.type === 'LoginForm'))
    .map(page => ({
      key: page.key,
      icon: ICON_MAP[page.icon ?? ''] ?? <FileOutlined />,
      label: page.title,
    }))

  return (
    <Layout style={{ height: '100vh' }}>

      <Sider
        width={220}
        style={{
          background: '#fff',
          borderRight: '1px solid #f0f0f0',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ padding: '20px 16px 12px' }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            size="small"
            onClick={() => navigate('/')}
            style={{ marginBottom: 12, padding: '0 4px' }}
          >
            返回
          </Button>
          <Title
            level={5}
            style={{ margin: 0, lineHeight: 1.4 }}
            ellipsis={{ tooltip: app.name }}
          >
            {app.name}
          </Title>
          {app.cellLine && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {app.cellLine}
            </Text>
          )}
          {currentUsername && (
            <Text
              type="secondary"
              style={{ fontSize: 12, display: 'block', marginTop: 4 }}
            >
              👤 {currentUsername}
            </Text>
          )}
        </div>

        <Menu
          mode="inline"
          selectedKeys={[activeKey]}
          style={{ border: 'none', flex: 1 }}
          items={menuItems}
          onClick={({ key }) => {
            if (!isLoggedIn) {
              const targetPage = pages.find(p => p.key === key)
              const isLoginPage = targetPage?.components.some(
                c => c.type === 'LoginForm'
              )
              if (!isLoginPage) {
                message.warning('请先登录')
                return
              }
            }
            setActiveKey(key)
          }}
        />

        <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0' }}>
          {isLoggedIn && app.password && (
            <Button
              block
              style={{ marginBottom: 8 }}
              onClick={handleLogout}
            >
              退出登录
            </Button>
          )}
          <Button
            block
            icon={<EditOutlined />}
            onClick={() => navigate(`/builder/${app.id}`)}
          >
            迭代修改
          </Button>
        </div>
      </Sider>

      <Layout>
        <Header style={{
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Text strong style={{ fontSize: 15 }}>
            {currentPage?.title}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            v{app.version} · {records.length} 条记录
          </Text>
        </Header>

        <Content style={{
          padding: '24px',
          overflowY: 'auto',
          background: '#F8F7FF',
        }}>
          {currentPage && (
            <PageRenderer
              page={currentPage}
              config={app}
              records={records}
              onSubmit={handleSubmit}
              onDelete={handleDelete}
              onExport={handleExport}
              onLogin={handleLogin}
              currentUsername={currentUsername}
            />
          )}
        </Content>
      </Layout>

    </Layout>
  )
}