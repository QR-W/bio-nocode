import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button, Result, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'

const { Paragraph, Text } = Typography

type Props = {
  children: ReactNode
  /** 显示在错误页标题，如「应用构建器」「应用运行」 */
  title?: string
}

type State = {
  hasError: boolean
  error: Error | null
}

export default class RouteErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[RouteErrorBoundary]', error.message, info.componentStack)
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <RouteErrorFallback
          error={this.state.error}
          title={this.props.title}
          onRetry={this.reset}
        />
      )
    }
    return this.props.children
  }
}

function RouteErrorFallback({
  error,
  title,
  onRetry,
}: {
  error: Error
  title?: string
  onRetry: () => void
}) {
  const navigate = useNavigate()
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      background: '#F8F7FF',
    }}>
      <Result
        status="error"
        title={title ?? '页面渲染出错'}
        subTitle={(
          <div style={{ textAlign: 'left', maxWidth: 480 }}>
            <Paragraph style={{ marginBottom: 8 }}>
              以下为错误信息（对话记录与草稿配置仍保留在内存中，重试后继续编辑）：
            </Paragraph>
            <Text code copyable style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {error.message || '未知错误'}
            </Text>
          </div>
        )}
        extra={[
          <Button type="primary" key="retry" onClick={onRetry}>
            重试渲染
          </Button>,
          <Button key="home" onClick={() => navigate('/')}>
            返回首页
          </Button>,
        ]}
      />
    </div>
  )
}
