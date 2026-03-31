import { useCallback, useEffect, useState } from 'react'
import { Layout, Menu, Typography, Button, Spin, message } from 'antd'
import {
  ArrowLeftOutlined, EditOutlined,
  DashboardOutlined, FormOutlined, TableOutlined,
  BarChartOutlined, UserOutlined, SearchOutlined,
  FileOutlined, UploadOutlined, HistoryOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { appRepo } from '../services/db/appRepo'
import {
  RECORD_SAMPLE_MAX,
  RECORD_TABLE_PAGE_SIZE_DEFAULT,
  recordRepo,
} from '../services/db/recordRepo'
import type { AppConfig, DataRecord } from '../types/AppConfig'
import PageRenderer from '../components/engine/PageRenderer'
import type { RecordAggregate } from '../components/widgets/types'

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
  /** 表格当前页（Dexie 分页） */
  const [recordsTable, setRecordsTable] = useState<DataRecord[]>([])
  /** 图表/时间轴：最近最多 RECORD_SAMPLE_MAX 条 */
  const [recordsSample, setRecordsSample] = useState<DataRecord[]>([])
  const [recordsTotal, setRecordsTotal] = useState(0)
  const [tablePage, setTablePage] = useState(1)
  const [tablePageSize, setTablePageSize] = useState(RECORD_TABLE_PAGE_SIZE_DEFAULT)
  const [recordAggregate, setRecordAggregate] = useState<RecordAggregate | null>(null)

  const [pageLoading, setPageLoading] = useState(true)
  const [activeKey, setActiveKey] = useState<string>('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUsername, setCurrentUsername] = useState('')

  const loadTablePage = useCallback(async (id: string, page: number, size: number) => {
    const offset = (page - 1) * size
    const rows = await recordRepo.listByAppPaged(id, offset, size)
    setRecordsTable(rows)
    setTablePage(page)
    setTablePageSize(size)
  }, [])

  useEffect(() => {
    if (appId) void loadData(appId)
  }, [appId])

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
      const appData = await appRepo.getById(id)
      if (!appData) {
        message.error('应用不存在')
        navigate('/')
        return
      }
      setApp(appData)

      const total = await recordRepo.countByApp(id)
      const size = RECORD_TABLE_PAGE_SIZE_DEFAULT
      const sampleLen = Math.min(RECORD_SAMPLE_MAX, total)
      const [pageRows, sampleRows, thisMonth] = await Promise.all([
        recordRepo.listByAppPaged(id, 0, size),
        recordRepo.listByAppPaged(id, 0, sampleLen),
        recordRepo.countByAppThisMonth(id),
      ])

      setRecordsTotal(total)
      setRecordsTable(pageRows)
      setRecordsSample(sampleRows)
      setTablePage(1)
      setTablePageSize(size)
      setRecordAggregate({
        total,
        thisMonthCount: thisMonth,
        latestCreatedAt: pageRows[0]?.createdAt ?? null,
      })

      const key = `loggedIn_${appData.id}`
      const saved = sessionStorage.getItem(key)

      if (saved === 'true') {
        const savedUsername = sessionStorage.getItem(`username_${appData.id}`)
        if (savedUsername) setCurrentUsername(savedUsername)
        setIsLoggedIn(true)

        const firstNonLogin = appData.pages?.find(p =>
          !p.components.some(c => c.type === 'LoginForm')
        )
        setActiveKey(firstNonLogin?.key ?? appData.pages?.[0]?.key ?? 'dashboard')
      } else {
        const loginPage = appData.pages?.find(p =>
          p.components.some(c => c.type === 'LoginForm')
        )
        setActiveKey(loginPage?.key ?? appData.pages?.[0]?.key ?? 'dashboard')
      }
    } finally {
      setPageLoading(false)
    }
  }

  const getRecordsForQuery = useCallback(async () => {
    if (!appId) return []
    return recordRepo.listByApp(appId)
  }, [appId])

  async function handleSubmit(values: Record<string, unknown>) {
    if (!appId) return
    try {
      const record = await recordRepo.create(appId, values)
      const total = await recordRepo.countByApp(appId)
      const thisMonth = await recordRepo.countByAppThisMonth(appId)
      const head = await recordRepo.listByAppPaged(appId, 0, 1)
      setRecordAggregate({
        total,
        thisMonthCount: thisMonth,
        latestCreatedAt: head[0]?.createdAt ?? null,
      })
      setRecordsTotal(total)

      if (tablePage === 1) {
        setRecordsTable(prev => [record, ...prev.slice(0, tablePageSize - 1)])
      } else {
        await loadTablePage(appId, tablePage, tablePageSize)
      }

      const cap = Math.min(RECORD_SAMPLE_MAX, total)
      const sample = await recordRepo.listByAppPaged(appId, 0, cap)
      setRecordsSample(sample)
      message.success('记录已提交')
    } catch {
      message.error('提交失败，请重试')
    }
  }

  async function handleDelete(id: string) {
    if (!appId) return
    await recordRepo.delete(id)
    const total = await recordRepo.countByApp(appId)
    const thisMonth = await recordRepo.countByAppThisMonth(appId)
    const head = await recordRepo.listByAppPaged(appId, 0, 1)
    setRecordAggregate({
      total,
      thisMonthCount: thisMonth,
      latestCreatedAt: head[0]?.createdAt ?? null,
    })
    setRecordsTotal(total)

    const offset = (tablePage - 1) * tablePageSize
    let rows = await recordRepo.listByAppPaged(appId, offset, tablePageSize)
    if (rows.length === 0 && tablePage > 1) {
      const nextPage = tablePage - 1
      const o2 = (nextPage - 1) * tablePageSize
      rows = await recordRepo.listByAppPaged(appId, o2, tablePageSize)
      setTablePage(nextPage)
    }
    setRecordsTable(rows)

    const cap = Math.min(RECORD_SAMPLE_MAX, total)
    const sample = cap > 0
      ? await recordRepo.listByAppPaged(appId, 0, cap)
      : []
    setRecordsSample(sample)
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

  async function handleExportReactSource() {
    if (!app) return
    try {
      const { exportReactProject } = await import('../utils/exportReactProject')
      await exportReactProject(app)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '导出失败')
    }
  }

  function handleLogin(password: string, username?: string): boolean {
    if (!app?.password) {
      message.error('该应用尚未设置访问密码，请联系管理员')
      return false
    }
    if (password !== app.password) return false

    handleLoginSuccess(username)
    if (username) setCurrentUsername(username)

    const pg = resolvedPages.find(p =>
      !p.components.some(c => c.type === 'LoginForm')
    )
    if (pg) setActiveKey(pg.key)
    return true
  }

  function handleLogout() {
    if (!app?.id) return
    sessionStorage.removeItem(`loggedIn_${app.id}`)
    sessionStorage.removeItem(`username_${app.id}`)
    setIsLoggedIn(false)
    setCurrentUsername('')
    const loginPage = resolvedPages.find(p =>
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

  const resolvedPages = app.pages?.length ? app.pages : [
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

  const currentPage = resolvedPages.find(p => p.key === activeKey) ?? resolvedPages[0]

  const menuItems = resolvedPages
    .filter(page => !page.components.some(c => c.type === 'LoginForm'))
    .map(page => ({
      key: page.key,
      icon: ICON_MAP[page.icon ?? ''] ?? <FileOutlined />,
      label: page.title,
    }))

  const onTablePageChange = (p: number, ps: number) => {
    if (appId) void loadTablePage(appId, p, ps)
  }

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
              const targetPage = resolvedPages.find(p => p.key === key)
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
            v{app.version} · {recordsTotal} 条记录
          </Text>
          <Button
            icon={<DownloadOutlined />}
            onClick={() => { void handleExportReactSource() }}
          >
            导出源码
          </Button>
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
              records={recordsTable}
              recordsSample={recordsSample}
              recordAggregate={recordAggregate ?? undefined}
              recordsRemote={{
                page: tablePage,
                pageSize: tablePageSize,
                total: recordsTotal,
                onPageChange: onTablePageChange,
              }}
              getRecordsForQuery={getRecordsForQuery}
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
