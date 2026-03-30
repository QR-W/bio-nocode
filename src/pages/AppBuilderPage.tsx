import { useState, useEffect } from 'react'
import { Layout, Typography, Button, message, Empty } from 'antd'
import { ArrowLeftOutlined, CheckOutlined } from '@ant-design/icons'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import ExperimentTypeSelector from '../components/builder/ExperimentTypeSelector'
import ChatPanel from '../components/builder/ChatPanel'
import AppPreview from '../components/runner/AppPreview'
import PropertiesPanel from '../components/editor/PropertiesPanel'
import { useBuilderStore } from '../stores/builderStore'
import { useEditorStore } from '../components/editor/useEditorStore'
import { generateApp, updateApp } from '../services/llm/appGenerator'
import { appRepo } from '../services/db/appRepo'
import type { AppConfig, ExperimentType } from '../types/AppConfig'

const { Header, Content } = Layout
const { Text } = Typography

export default function AppBuilderPage() {
  const navigate = useNavigate()
  const { appId } = useParams<{ appId?: string }>()
  const [searchParams] = useSearchParams()

  const initType = searchParams.get('type') as ExperimentType | null
  const hasInit = searchParams.get('hasInit')
  const initMsg = hasInit ? sessionStorage.getItem('builderInitMsg') : null

  const {
    messages, currentConfig, status,
    addUserMessage, addAssistantMessage,
    setCurrentConfig, setStatus, reset,
  } = useBuilderStore()

  const { selectionType, clearSelection } = useEditorStore()

  const [experimentType, setExperimentType] = useState<ExperimentType | null>(
    initType ?? (initMsg ? 'project' : null)
  )
  const [confirming, setConfirming] = useState(false)
  const [hasAutoSent, setHasAutoSent] = useState(false)
  const [waitingForPassword, setWaitingForPassword] = useState(false)

  const loading = status === 'generating'

  // 属性面板是否显示（有选中元素时覆盖左侧）
  const showProperties = Boolean(selectionType && currentConfig)

  useEffect(() => {
    if (initMsg && experimentType && !hasAutoSent) {
      setHasAutoSent(true)
      sessionStorage.removeItem('builderInitMsg')  // ← 用完清除
      handleSend(initMsg)
    }
  }, [experimentType])

  useEffect(() => {
    if (appId) {
      appRepo.getById(appId).then(app => {
        if (app) {
          setCurrentConfig(app)
          setExperimentType(app.experimentType)
        }
      })
    }
    return () => {
      reset()
      clearSelection()
    }
  }, [appId])

  async function handleSend(content: string) {
    if (!experimentType) return

    if (waitingForPassword) {
      const password = content.trim()
      if (!password) return
      addUserMessage(content)
      const updated = { ...currentConfig!, password }
      setCurrentConfig(updated)
      addAssistantMessage(
        `✅ 访问密码已设置：${password}\n\n右侧预览已更新，确认无误后点击「确认创建应用」。`
      )
      setWaitingForPassword(false)
      return
    }

    addUserMessage(content)
    setStatus('generating')

    try {
      let partial

      if (!currentConfig) {
        partial = await generateApp(content, experimentType)
      } else {
        partial = await updateApp(content, currentConfig)
      }

      const merged = currentConfig
        ? { ...currentConfig, ...partial } as AppConfig
        : {
          id: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1,
          experimentType,
          userId: '',
          ...partial,
        } as AppConfig

      // 清除 LLM 可能生成的密码
      if (!currentConfig) {
        delete (merged as unknown as Record<string, unknown>).password
      }

      setCurrentConfig(merged)

      if (!appId && !currentConfig && !merged.password) {
        addAssistantMessage(
          '已生成应用配置，请设置一个访问密码（实验室成员需要输入此密码才能进入应用）：'
        )
        setWaitingForPassword(true)
      } else {
        addAssistantMessage('已根据你的需求更新了应用配置，请在右侧预览确认。')
      }

      setStatus('done')
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : '生成失败，请重试'
      addAssistantMessage(`生成失败：${errMsg}`)
      setStatus('error', errMsg)
    }
  }

  async function handleConfirm() {
    if (!currentConfig) return

    const hasLoginPage = currentConfig.pages?.some(p =>
      p.components.some(c => c.type === 'LoginForm')
    )
    if (hasLoginPage && !currentConfig.password) {
      addAssistantMessage('检测到应用包含登录功能，请先设置访问密码：')
      setWaitingForPassword(true)
      return
    }

    setConfirming(true)
    try {
      if (appId) {
        await appRepo.update(appId, currentConfig)
        message.success('应用已更新')
        navigate(`/app/${appId}`)
      } else {
        const app = await appRepo.create(currentConfig)
        message.success('应用已创建')
        reset()
        clearSelection()
        navigate(`/app/${app.id}`)
      }
    } catch {
      message.error('保存失败，请重试')
    } finally {
      setConfirming(false)
    }
  }

  function handleConfigChange(updated: AppConfig) {
    setCurrentConfig(updated)
  }

  function handleBack() {
    reset()
    clearSelection()
    navigate('/')
  }

  if (!experimentType) {
    return <ExperimentTypeSelector onSelect={setExperimentType} />
  }

  return (
    <Layout style={{ height: '100vh' }}>
      <Header style={{
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button icon={<ArrowLeftOutlined />} type="text" onClick={handleBack} />
          <Text strong style={{ fontSize: 16 }}>
            {appId ? '迭代应用' : '新建应用'}
          </Text>
        </div>
        <Button
          type="primary"
          icon={<CheckOutlined />}
          loading={confirming}
          onClick={handleConfirm}
          disabled={!currentConfig}
        >
          确认创建应用
        </Button>
      </Header>

      <Content style={{
        display: 'flex',
        overflow: 'hidden',
        height: 'calc(100vh - 64px)',
      }}>

        {/* 左侧：对话区 或 属性面板 */}
        <div style={{
          flex: '0 0 40%',
          borderRight: '1px solid #f0f0f0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}>
          {/* 对话区（始终存在，被属性面板覆盖时隐藏） */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: showProperties ? 'none' : 'flex',
            flexDirection: 'column',
          }}>
            <ChatPanel
              messages={messages}
              loading={loading}
              onSend={handleSend}
              waitingForPassword={waitingForPassword}
            />
          </div>

          {/* 属性面板（选中元素时覆盖） */}
          {showProperties && currentConfig && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              background: '#fff',
              zIndex: 10,
            }}>
              {/* 属性面板顶部栏 */}
              <div style={{
                padding: '10px 16px',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}>
                <Text strong style={{ fontSize: 13 }}>属性面板</Text>
                <Button
                  size="small"
                  type="text"
                  onClick={clearSelection}
                >
                  ← 返回对话
                </Button>
              </div>

              {/* 属性内容 */}
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <PropertiesPanel
                  config={currentConfig}
                  onConfigChange={handleConfigChange}
                />
              </div>
            </div>
          )}
        </div>

        {/* 右侧：预览区 */}
        <div style={{ flex: '0 0 60%', overflow: 'hidden' }}>
          {currentConfig ? (
            <AppPreview
              config={currentConfig}
              onConfigChange={handleConfigChange}
            />
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="对话后将在此预览生成的应用"
              />
            </div>
          )}
        </div>

      </Content>
    </Layout>
  )
}