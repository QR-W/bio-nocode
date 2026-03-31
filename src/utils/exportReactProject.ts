import JSZip from 'jszip'
import type { AppConfig } from '../types/AppConfig'

export async function exportReactProject(app: AppConfig) {
  const zip = new JSZip()
  const name = app.name.replace(/\s+/g, '-').toLowerCase()
  const configJson = JSON.stringify(app, null, 2)

  // ── package.json ──────────────────────────────────────────
  zip.file('package.json', JSON.stringify({
    name,
    version: '1.0.0',
    private: true,
    scripts: {
      dev: 'vite',
      build: 'tsc && vite build',
      preview: 'vite preview',
    },
    dependencies: {
      'react': '^18.3.0',
      'react-dom': '^18.3.0',
      'antd': '^5.15.0',
      '@ant-design/icons': '^5.3.0',
      'recharts': '^2.12.0',
      'dayjs': '^1.11.10',
      'dexie': '^4.0.1',
    },
    devDependencies: {
      '@types/react': '^18.3.0',
      '@types/react-dom': '^18.3.0',
      '@vitejs/plugin-react': '^4.3.0',
      'typescript': '^5.4.0',
      'vite': '^5.2.0',
    },
  }, null, 2))

  // ── vite.config.ts ────────────────────────────────────────
  zip.file('vite.config.ts', `
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
`.trim())

  // ── tsconfig.json ─────────────────────────────────────────
  zip.file('tsconfig.json', JSON.stringify({
    compilerOptions: {
      target: 'ES2020',
      useDefineForClassFields: true,
      lib: ['ES2020', 'DOM', 'DOM.Iterable'],
      module: 'ESNext',
      skipLibCheck: true,
      moduleResolution: 'bundler',
      allowImportingTsExtensions: true,
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: 'react-jsx',
      strict: true,
    },
    include: ['src'],
  }, null, 2))

  // ── index.html ────────────────────────────────────────────
  zip.file('index.html', `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${app.name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`)

  // ── src/appConfig.ts ──────────────────────────────────────
  zip.file('src/appConfig.ts', `import type { AppConfig } from './types'

export const APP_CONFIG: AppConfig = ${configJson}
`)

  // ── src/types.ts ──────────────────────────────────────────
  zip.file('src/types.ts', `
export type ExperimentType =
  | 'passage' | 'cryopreservation' | 'transfection'
  | 'flow_cytometry' | 'drug_assay' | 'project'

export type FieldType =
  | 'text' | 'textarea' | 'number' | 'date'
  | 'select' | 'multiselect' | 'boolean' | 'file'

export type ComponentType =
  | 'DataForm' | 'DataTable' | 'StatsCards' | 'ChartView'
  | 'LoginForm' | 'SearchBar' | 'RichTextEditor'
  | 'FileUploader' | 'Timeline'

export type ChartType = 'line' | 'bar' | 'scatter' | 'pie'

export interface FieldValidation { min?: number; max?: number }

export interface FieldInputStyle {
  width?: number; borderColor?: string; borderRadius?: number
  borderWidth?: number; background?: string; fontSize?: number
  color?: string; rows?: number; padding?: number
}

export interface FieldDef {
  name: string; label: string; type: FieldType
  required?: boolean; placeholder?: string; unit?: string
  options?: string[]; validation?: FieldValidation
  defaultValue?: unknown; helpText?: string
  inputStyle?: FieldInputStyle
}

export interface ChartConfig {
  id: string; title: string; type: ChartType
  xField: string; yField: string; groupField?: string
}

export interface ComponentStyle {
  span?: number; background?: string; border?: string
  padding?: number; titleColor?: string; titleSize?: number
}

export interface PageStyle { background?: string; gap?: number }

export interface ComponentConfig {
  id: string; type: ComponentType; title?: string
  props?: Record<string, unknown>; style?: ComponentStyle
}

export interface PageConfig {
  key: string; title: string; icon?: string
  components: ComponentConfig[]; style?: PageStyle
}

export interface ViewConfig {
  tableColumns: string[]
  defaultSort?: { field: string; order: 'asc' | 'desc' }
  charts: ChartConfig[]
}

export interface AppConfig {
  id: string; name: string; description: string
  experimentType: ExperimentType; cellLine?: string
  password?: string; fields: FieldDef[]; views: ViewConfig
  pages: PageConfig[]; createdAt: string; updatedAt: string
  version: number; userId: string
}

export interface DataRecord {
  id: string; appId: string
  data: Record<string, unknown>
  createdAt: string; updatedAt: string
}
`.trim())

  // ── src/db.ts ─────────────────────────────────────────────
  zip.file('src/db.ts', `
import Dexie, { type Table } from 'dexie'
import type { DataRecord } from './types'

class AppDB extends Dexie {
  records!: Table<DataRecord>
  constructor() {
    super('ExportedAppDB_${app.id}')
    this.version(1).stores({ records: 'id, appId, createdAt' })
  }
}

export const db = new AppDB()
`.trim())

  // ── src/main.tsx ──────────────────────────────────────────
  zip.file('src/main.tsx', `
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{ token: { colorPrimary: '#4F46E5', borderRadius: 8 } }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>
)
`.trim())

  // ── src/App.tsx ───────────────────────────────────────────
  zip.file('src/App.tsx', `
import React, { useState, useEffect } from 'react'
import { Layout, Menu, Button, Spin, message, Typography } from 'antd'
import {
  DashboardOutlined, FormOutlined, TableOutlined,
  BarChartOutlined, UserOutlined, FileOutlined,
  SearchOutlined, UploadOutlined, HistoryOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { APP_CONFIG } from './appConfig'
import { db } from './db'
import type { DataRecord, PageConfig, ComponentConfig } from './types'
import FormPage      from './pages/FormPage'
import TablePage     from './pages/TablePage'
import StatsPage     from './pages/StatsPage'
import ChartPage     from './pages/ChartPage'
import LoginPage     from './pages/LoginPage'
import SearchPage    from './pages/SearchPage'
import TimelinePage  from './pages/TimelinePage'

const { Sider, Header, Content } = Layout
const { Title, Text } = Typography

const ICON_MAP: Record<string, React.ReactNode> = {
  DashboardOutlined: <DashboardOutlined />,
  FormOutlined:      <FormOutlined />,
  TableOutlined:     <TableOutlined />,
  BarChartOutlined:  <BarChartOutlined />,
  UserOutlined:      <UserOutlined />,
  SearchOutlined:    <SearchOutlined />,
  FileOutlined:      <FileOutlined />,
  UploadOutlined:    <UploadOutlined />,
  HistoryOutlined:   <HistoryOutlined />,
}

const AUTH_KEY      = 'app_auth_' + APP_CONFIG.id
const AUTH_NAME_KEY = 'app_auth_name_' + APP_CONFIG.id

const loginPage      = APP_CONFIG.pages.find(p => p.components.some(c => c.type === 'LoginForm'))
const nonLoginPages  = APP_CONFIG.pages.filter(p => !p.components.some(c => c.type === 'LoginForm'))

export default function App() {
  const [records,    setRecords]    = useState<DataRecord[]>([])
  const [loading,    setLoading]    = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activeKey,  setActiveKey]  = useState('')
  const [username,   setUsername]   = useState('')

  useEffect(() => {
    loadData()
    const saved = sessionStorage.getItem(AUTH_KEY)
    if (saved === 'true') {
      setIsLoggedIn(true)
      setUsername(sessionStorage.getItem(AUTH_NAME_KEY) ?? '')
      setActiveKey(nonLoginPages[0]?.key ?? APP_CONFIG.pages[0]?.key ?? '')
    } else if (!loginPage || !APP_CONFIG.password) {
      setIsLoggedIn(true)
      setActiveKey(nonLoginPages[0]?.key ?? APP_CONFIG.pages[0]?.key ?? '')
    } else {
      setActiveKey(loginPage?.key ?? '')
    }
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const list = await db.records
        .where('appId').equals(APP_CONFIG.id)
        .reverse().sortBy('createdAt')
      setRecords(list)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(data: Record<string, unknown>) {
    const now = new Date().toISOString()
    const record: DataRecord = {
      id: crypto.randomUUID(), appId: APP_CONFIG.id,
      data, createdAt: now, updatedAt: now,
    }
    await db.records.add(record)
    setRecords(prev => [record, ...prev])
    message.success('记录已提交')
  }

  async function handleDelete(id: string) {
    await db.records.delete(id)
    setRecords(prev => prev.filter(r => r.id !== id))
    message.success('已删除')
  }

  function handleLogin(password: string, name?: string): boolean {
    if (!APP_CONFIG.password || password === APP_CONFIG.password) {
      sessionStorage.setItem(AUTH_KEY, 'true')
      if (name) sessionStorage.setItem(AUTH_NAME_KEY, name)
      setIsLoggedIn(true)
      setUsername(name ?? '')
      setActiveKey(nonLoginPages[0]?.key ?? '')
      return true
    }
    return false
  }

  function handleLogout() {
    sessionStorage.removeItem(AUTH_KEY)
    sessionStorage.removeItem(AUTH_NAME_KEY)
    setIsLoggedIn(false)
    setUsername('')
    setActiveKey(loginPage?.key ?? '')
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    )
  }

  const currentPage = APP_CONFIG.pages.find(p => p.key === activeKey)
  const menuItems   = nonLoginPages.map(p => ({
    key:   p.key,
    icon:  ICON_MAP[p.icon ?? ''] ?? <FileOutlined />,
    label: p.title,
  }))

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider width={220} style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}>
        <div style={{ padding: '20px 16px 12px' }}>
          <Title level={5} style={{ margin: 0 }} ellipsis={{ tooltip: APP_CONFIG.name }}>
            {APP_CONFIG.name}
          </Title>
          {username && (
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
              👤 {username}
            </Text>
          )}
        </div>

        <Menu
          mode="inline"
          selectedKeys={[activeKey]}
          style={{ border: 'none' }}
          items={menuItems}
          onClick={({ key }) => {
            if (!isLoggedIn) { message.warning('请先登录'); return }
            setActiveKey(key)
          }}
        />

        {isLoggedIn && APP_CONFIG.password && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0' }}>
            <Button block icon={<LogoutOutlined />} onClick={handleLogout}>
              退出登录
            </Button>
          </div>
        )}
      </Sider>

      <Layout>
        <Header style={{
          background:     '#fff',
          borderBottom:   '1px solid #f0f0f0',
          padding:        '0 24px',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
        }}>
          <Text strong style={{ fontSize: 15 }}>{currentPage?.title}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>v{APP_CONFIG.version}</Text>
        </Header>

        <Content style={{
          padding:    24,
          overflowY:  'auto',
          background: currentPage?.style?.background ?? '#F8F7FF',
        }}>
          {renderPage(currentPage, {
            records,
            onSubmit: handleSubmit,
            onDelete: handleDelete,
            onLogin:  handleLogin,
          })}
        </Content>
      </Layout>
    </Layout>
  )
}

function renderPage(
  page: PageConfig | undefined,
  handlers: {
    records:  DataRecord[]
    onSubmit: (data: Record<string, unknown>) => Promise<void>
    onDelete: (id: string) => Promise<void>
    onLogin:  (password: string, name?: string) => boolean
  }
) {
  if (!page) return null
  return (
    <React.Fragment>
      {page.components.map((comp: ComponentConfig) => {
        switch (comp.type) {
          case 'LoginForm':  return <LoginPage    key={comp.id} comp={comp} onLogin={handlers.onLogin} />
          case 'StatsCards': return <StatsPage    key={comp.id} records={handlers.records} />
          case 'DataForm':   return <FormPage     key={comp.id} comp={comp} onSubmit={handlers.onSubmit} />
          case 'DataTable':  return <TablePage    key={comp.id} comp={comp} records={handlers.records} onDelete={handlers.onDelete} />
          case 'ChartView':  return <ChartPage    key={comp.id} comp={comp} records={handlers.records} />
          case 'SearchBar':  return <SearchPage   key={comp.id} comp={comp} />
          case 'Timeline':   return <TimelinePage key={comp.id} comp={comp} records={handlers.records} />
          default:           return null
        }
      })}
    </React.Fragment>
  )
}
`.trim())

  // ── src/pages/LoginPage.tsx ───────────────────────────────
  zip.file('src/pages/LoginPage.tsx', `
import React from 'react'
import { Card, Form, Input, Button, Typography, Divider, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import type { ComponentConfig } from '../types'

const { Title, Text } = Typography

interface Props {
  comp:    ComponentConfig
  onLogin: (password: string, name?: string) => boolean
}

export default function LoginPage({ comp, onLogin }: Props) {
  const [form] = Form.useForm()

  function handleSubmit(values: { username: string; password: string }) {
    const ok = onLogin(values.password, values.username)
    if (!ok) {
      message.error('密码错误，请重试')
      form.resetFields(['password'])
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <Card style={{ width: 420, borderRadius: 12 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🧬</div>
          <Title level={4} style={{ margin: 0 }}>
            {comp.props?.title as string ?? 'HeLa细胞传代培养管理系统'}
          </Title>
          <Text type="secondary">请登录以继续使用</Text>
        </div>
        <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off">
          <Form.Item name="username" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input
              prefix={<UserOutlined />}
              placeholder="姓名（用于记录操作者）"
              size="large"
              autoComplete="new-password"
            />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入访问密码' }]}>
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="实验室访问密码"
              size="large"
              autoComplete="new-password"
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large" style={{ borderRadius: 8 }}>
            进入系统
          </Button>
        </Form>
        <Divider />
        <Text type="secondary" style={{ fontSize: 12, display: 'block', textAlign: 'center' }}>
          {comp.props?.footer as string ?? '请联系管理员获取访问密码'}
        </Text>
      </Card>
    </div>
  )
}
`.trim())

  // ── src/pages/StatsPage.tsx ───────────────────────────────
  zip.file('src/pages/StatsPage.tsx', `
import React from 'react'
import { Card, Row, Col, Statistic } from 'antd'
import type { DataRecord } from '../types'
import { APP_CONFIG } from '../appConfig'

export default function StatsPage({ records }: { records: DataRecord[] }) {
  const thisMonth = records.filter(r => {
    const d = new Date(r.createdAt), n = new Date()
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear()
  }).length
  const last = records[0]
    ? new Date(records[0].createdAt).toLocaleDateString('zh-CN')
    : '暂无'

  return (
    <Row gutter={[16, 16]}>
      <Col span={6}>
        <Card>
          <Statistic title="总记录数" value={records.length} suffix="条"
            valueStyle={{ color: '#4F46E5' }} />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic title="本月新增" value={thisMonth} suffix="条"
            valueStyle={{ color: '#059669' }} />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic title="字段数量" value={APP_CONFIG.fields.length} suffix="个"
            valueStyle={{ color: '#D97706' }} />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic title="最近录入" value={last}
            valueStyle={{ fontSize: 16, color: '#6B7280' }} />
        </Card>
      </Col>
    </Row>
  )
}
`.trim())

  // ── src/pages/FormPage.tsx ────────────────────────────────
  zip.file('src/pages/FormPage.tsx', `
import React, { useState } from 'react'
import {
  Card, Form, Input, InputNumber, DatePicker,
  Select, Switch, Button, Typography, Upload,
} from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import type { ComponentConfig } from '../types'
import { APP_CONFIG } from '../appConfig'

const { Text } = Typography

interface Props {
  comp:     ComponentConfig
  onSubmit: (data: Record<string, unknown>) => Promise<void>
}

export default function FormPage({ comp, onSubmit }: Props) {
  const [form]    = Form.useForm()
  const [loading, setLoading] = useState(false)

  async function handleFinish(values: Record<string, unknown>) {
    setLoading(true)
    try {
      await onSubmit(values)
      form.resetFields()
    } finally {
      setLoading(false)
    }
  }

  function renderInput(field: typeof APP_CONFIG.fields[0]) {
    const s = field.inputStyle ?? {}
    const style: React.CSSProperties = {
      borderColor:  s.borderColor,
      borderRadius: s.borderRadius,
      background:   s.background,
      fontSize:     s.fontSize,
      color:        s.color,
      width:        s.width ? \`\${s.width}%\` : '100%',
    }

    switch (field.type) {
      case 'textarea':
        return <Input.TextArea style={style} rows={s.rows ?? 3} placeholder={field.placeholder} />
      case 'number':
        return (
          <InputNumber
            style={{ ...style, width: s.width ? \`\${s.width}%\` : '100%' }}
            min={field.validation?.min} max={field.validation?.max}
            placeholder={field.placeholder}
          />
        )
      case 'date':
        return <DatePicker style={style} />
      case 'select':
        return (
          <Select
            style={style}
            placeholder={field.placeholder ?? \`请选择\${field.label}\`}
            options={(field.options ?? []).map(o => ({ label: o, value: o }))}
          />
        )
      case 'multiselect':
        return (
          <Select
            mode="multiple"
            style={style}
            placeholder={field.placeholder ?? \`请选择\${field.label}\`}
            options={(field.options ?? []).map(o => ({ label: o, value: o }))}
          />
        )
      case 'boolean':
        return <Switch />
      case 'file':
        return (
          <Upload beforeUpload={() => false} maxCount={1}>
            <Button icon={<UploadOutlined />}>选择文件</Button>
          </Upload>
        )
      default:
        return <Input style={style} placeholder={field.placeholder} />
    }
  }

  return (
    <Card style={{ maxWidth: 720 }}>
      <Text type="secondary" style={{ display: 'block', marginBottom: 20, fontSize: 13 }}>
        带 * 为必填项
      </Text>
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        {APP_CONFIG.fields.map(field => (
          <Form.Item
            key={field.name}
            name={field.name}
            label={
              <span>
                {field.label}
                {field.unit && (
                  <span style={{ color: '#888', marginLeft: 4, fontWeight: 400 }}>
                    ({field.unit})
                  </span>
                )}
              </span>
            }
            rules={[{ required: field.required, message: \`请填写\${field.label}\` }]}
            extra={field.helpText}
            valuePropName={field.type === 'boolean' ? 'checked' : 'value'}
          >
            {renderInput(field)}
          </Form.Item>
        ))}
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            {comp.props?.submitText as string ?? '提交记录'}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  )
}
`.trim())

  // ── src/pages/TablePage.tsx ───────────────────────────────
  zip.file('src/pages/TablePage.tsx', `
import React from 'react'
import { Card, Table, Button, Popconfirm, Typography } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import type { ComponentConfig, DataRecord } from '../types'
import { APP_CONFIG } from '../appConfig'

const { Text } = Typography

interface Props {
  comp:     ComponentConfig
  records:  DataRecord[]
  onDelete: (id: string) => Promise<void>
}

export default function TablePage({ comp, records, onDelete }: Props) {
  const cols = APP_CONFIG.views.tableColumns

  const columns = [
    ...cols.map(c => {
      const f = APP_CONFIG.fields.find(f => f.name === c)
      return {
        title:     f?.label ?? c,
        dataIndex: ['data', c],
        key:       c,
        ellipsis:  true,
        render:    (val: unknown) =>
          val === undefined || val === null ? '—' : String(val),
      }
    }),
    {
      title:     '录入时间',
      key:       'createdAt',
      width:     150,
      render:    (_: unknown, r: DataRecord) =>
        new Date(r.createdAt).toLocaleDateString('zh-CN'),
    },
    {
      title:  '操作',
      key:    'action',
      width:  80,
      render: (_: unknown, r: DataRecord) => (
        <Popconfirm
          title="确认删除？"
          onConfirm={() => onDelete(r.id)}
          okText="删除" cancelText="取消"
          okButtonProps={{ danger: true }}
        >
          <Button type="text" danger size="small">删除</Button>
        </Popconfirm>
      ),
    },
  ]

  function exportCSV() {
    const header = cols
      .map(c => APP_CONFIG.fields.find(f => f.name === c)?.label ?? c)
      .join(',')
    const rows = records
      .map(r => cols
        .map(c => { const v = String(r.data[c] ?? ''); return v.includes(',') ? \`"\${v}"\` : v })
        .join(',')
      ).join('\\n')
    const blob = new Blob([header + '\\n' + rows], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = Object.assign(document.createElement('a'), {
      href: url, download: APP_CONFIG.name + '.csv',
    })
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text type="secondary">{records.length} 条记录</Text>
        {comp.props?.showExport !== false && (
          <Button size="small" icon={<DownloadOutlined />} onClick={exportCSV}>
            导出 CSV
          </Button>
        )}
      </div>
      <Table
        columns={columns}
        dataSource={records}
        rowKey="id"
        size="small"
        pagination={{
          pageSize:        comp.props?.pageSize as number ?? 10,
          showSizeChanger: false,
        }}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: '暂无数据，请先录入实验记录' }}
      />
    </Card>
  )
}
`.trim())

  // ── src/pages/ChartPage.tsx ───────────────────────────────
  zip.file('src/pages/ChartPage.tsx', `
import React from 'react'
import { Card, Empty } from 'antd'
import {
  LineChart, Line, BarChart, Bar,
  ScatterChart, Scatter, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { ComponentConfig, DataRecord, ChartType } from '../types'
import { APP_CONFIG } from '../appConfig'

const COLORS = ['#4F46E5', '#059669', '#D97706', '#DC2626', '#7C3AED']

interface Props { comp: ComponentConfig; records: DataRecord[] }

export default function ChartPage({ comp, records }: Props) {
  const charts = (comp.props?.xField && comp.props?.yField)
    ? [{
        id:     'c1',
        title:  comp.props.chartTitle as string ?? comp.title ?? '图表',
        type:   (comp.props.chartType as ChartType) ?? 'line',
        xField: comp.props.xField as string,
        yField: comp.props.yField as string,
      }]
    : APP_CONFIG.views.charts.slice(0, 1)

  if (charts.length === 0) {
    return <Empty description="暂未配置图表" style={{ padding: 60 }} />
  }

  return (
    <>
      {charts.map((chart, idx) => {
        const data = records
          .map(r => ({ x: r.data[chart.xField], y: r.data[chart.yField] }))
          .filter(d => d.x !== undefined && d.y !== undefined)
          .reverse()

        const color = COLORS[idx % COLORS.length]

        return (
          <Card key={chart.id} title={chart.title} style={{ marginBottom: 16 }}>
            {data.length === 0 ? (
              <Empty description="暂无数据，请先录入实验记录" style={{ padding: 24 }} />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                {chart.type === 'bar' ? (
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="x" /><YAxis /><Tooltip />
                    <Bar dataKey="y" fill={color} radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : chart.type === 'scatter' ? (
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="x" /><YAxis dataKey="y" /><Tooltip />
                    <Scatter data={data} fill={color} />
                  </ScatterChart>
                ) : chart.type === 'pie' ? (
                  <PieChart>
                    <Pie
                      data={data.map(d => ({ name: String(d.x), value: Number(d.y) }))}
                      dataKey="value" nameKey="name"
                      cx="50%" cy="50%" outerRadius={100}
                      label={({ name, percent }: { name: string; percent: number }) =>
                        \`\${name} \${(percent * 100).toFixed(0)}%\`
                      }
                    >
                      {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                ) : (
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="x" /><YAxis /><Tooltip />
                    <Line type="monotone" dataKey="y" stroke={color} strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            )}
          </Card>
        )
      })}
    </>
  )
}
`.trim())

  // ── src/pages/SearchPage.tsx ──────────────────────────────
  zip.file('src/pages/SearchPage.tsx', `
import React from 'react'
import { Card, Input } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import type { ComponentConfig } from '../types'

export default function SearchPage({ comp }: { comp: ComponentConfig }) {
  return (
    <Card style={{ marginBottom: 0 }}>
      <Input
        size="large"
        prefix={<SearchOutlined />}
        placeholder={comp.props?.placeholder as string ?? '搜索记录...'}
        style={{ borderRadius: 8 }}
      />
    </Card>
  )
}
`.trim())

  // ── src/pages/TimelinePage.tsx ────────────────────────────
  zip.file('src/pages/TimelinePage.tsx', `
import React from 'react'
import { Card, Timeline, Empty, Typography } from 'antd'
import { ClockCircleOutlined } from '@ant-design/icons'
import type { ComponentConfig, DataRecord } from '../types'
import { APP_CONFIG } from '../appConfig'

const { Text } = Typography

interface Props { comp: ComponentConfig; records: DataRecord[] }

export default function TimelinePage({ comp, records }: Props) {
  const max   = comp.props?.maxItems as number ?? 20
  const field = APP_CONFIG.fields[0]?.name

  if (records.length === 0) {
    return <Empty description="暂无记录" style={{ padding: 40 }} />
  }

  const items = records.slice(0, max).map(r => ({
    dot:      <ClockCircleOutlined style={{ color: '#4F46E5' }} />,
    label:    new Date(r.createdAt).toLocaleDateString('zh-CN'),
    children: (
      <Text strong>
        {field ? String(r.data[field] ?? '') : '记录'}
      </Text>
    ),
  }))

  return (
    <Card title={comp.props?.title as string ?? '实验时间轴'}>
      <Timeline mode="left" items={items} />
    </Card>
  )
}
`.trim())

  // ── README.md ─────────────────────────────────────────────
  zip.file('README.md', `# ${app.name}

由 BioForm 平台生成的实验数据管理系统。

## 快速启动

\`\`\`bash
npm install
npm run dev
\`\`\`

## 生产构建

\`\`\`bash
npm run build
\`\`\`

构建产物在 \`dist/\` 目录，可部署到任意静态服务器。

## 部署到 Vercel

1. 将项目推送到 GitHub
2. 在 vercel.com 导入仓库
3. 一键部署，获得免费域名

## 技术栈

- React 18 + TypeScript
- Vite
- Ant Design 5
- Dexie.js (IndexedDB)
- Recharts

## 数据存储

数据存储在浏览器本地 IndexedDB 中。
如需多设备同步，请联系开发者添加后端支持。
`)

  // ── 生成 zip 并下载 ───────────────────────────────────────
  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name}-source.zip`
  a.click()
  URL.revokeObjectURL(url)
}