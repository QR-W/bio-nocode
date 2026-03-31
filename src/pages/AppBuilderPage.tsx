import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Layout, Typography, Button, message, Empty, Modal, Switch, Space, Alert, Spin } from 'antd'
import { ArrowLeftOutlined, CheckOutlined, ControlOutlined, BookOutlined } from '@ant-design/icons'
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
import {
  BUILDER_SAVE_LABEL_CREATE,
  BUILDER_SAVE_LABEL_ITERATE,
} from '../constants/branding'
import { BUILDER_QUICK_PROMPTS } from '../constants/quickPrompts'
import { collectConfigWarnings } from '../services/appConfigWarnings'

const { Header, Content } = Layout
const { Text } = Typography

const EXPERIMENT_TYPES: ExperimentType[] = [
  'passage', 'cryopreservation', 'transfection', 'flow_cytometry', 'drug_assay', 'project',
]

const SCENE_HINT_LABEL: Record<ExperimentType, string> = {
  passage: '传代培养',
  cryopreservation: '冻存与复苏',
  transfection: '转染实验',
  flow_cytometry: '流式',
  drug_assay: '药效检测',
  project: '自由描述',
}

function experimentTypeFromSearch(raw: string | null): ExperimentType | null {
  if (!raw) return null
  return EXPERIMENT_TYPES.includes(raw as ExperimentType) ? (raw as ExperimentType) : null
}

export default function AppBuilderPage() {
  const navigate = useNavigate()
  const { appId } = useParams<{ appId?: string }>()
  const primarySaveLabel = appId ? BUILDER_SAVE_LABEL_ITERATE : BUILDER_SAVE_LABEL_CREATE
  const [searchParams] = useSearchParams()

  const initType = experimentTypeFromSearch(searchParams.get('type'))
  const hasInit = searchParams.get('hasInit')
  const initMsg = hasInit ? sessionStorage.getItem('builderInitMsg') : null

  const {
    messages, currentConfig, status,
    addUserMessage, addAssistantMessage,
    setCurrentConfig, setStatus, reset,
  } = useBuilderStore()

  const { selectionType, clearSelection } = useEditorStore()

  const [experimentType, setExperimentType] = useState<ExperimentType | null>(() => {
    if (initType) return initType
    if (initMsg) return 'project'
    if (appId) return null
    return 'project'
  })
  const [confirming, setConfirming] = useState(false)
  const [hasAutoSent, setHasAutoSent] = useState(false)
  const [runnerOptionsOpen, setRunnerOptionsOpen] = useState(false)
  const [sceneHintsOpen, setSceneHintsOpen] = useState(false)
  const [waitingForPassword, setWaitingForPassword] = useState(false)

  const loading = status === 'generating'

  const llmRequestSeqRef = useRef(0)
  const handleSendRef = useRef<(content: string) => Promise<void>>(async () => {})

  // 属性面板是否显示（有选中元素时覆盖左侧）
  const showProperties = Boolean(selectionType && currentConfig)

  const configWarnings = useMemo(
    () => (currentConfig ? collectConfigWarnings(currentConfig) : []),
    [currentConfig],
  )

  const propertiesBackRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!showProperties) return
    const id = window.requestAnimationFrame(() => {
      propertiesBackRef.current?.focus()
    })
    return () => cancelAnimationFrame(id)
  }, [showProperties])

  useEffect(() => {
    if (!showProperties) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      e.preventDefault()
      clearSelection()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [showProperties, clearSelection])

  const handleSend = useCallback(async (content: string) => {
    if (!experimentType) return

    if (waitingForPassword) {
      const password = content.trim()
      if (!password) return
      const base = useBuilderStore.getState().currentConfig
      if (!base) return
      addUserMessage(content)
      const updated = { ...base, password }
      setCurrentConfig(updated)
      addAssistantMessage(
        `✅ 访问密码已设置：${password}\n\n右侧预览已更新，确认无误后点击「${primarySaveLabel}」。`
      )
      setWaitingForPassword(false)
      return
    }

    addUserMessage(content)
    setStatus('generating')
    const requestId = ++llmRequestSeqRef.current
    const baseSnapshot = useBuilderStore.getState().currentConfig

    try {
      let partial

      if (!baseSnapshot) {
        partial = await generateApp(content, experimentType)
      } else {
        partial = await updateApp(content, baseSnapshot)
      }

      if (requestId !== llmRequestSeqRef.current) return

      const merged = baseSnapshot
        ? { ...baseSnapshot, ...partial } as AppConfig
        : {
          id: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1,
          experimentType,
          userId: '',
          ...partial,
        } as AppConfig

      if (!baseSnapshot) {
        delete (merged as unknown as Record<string, unknown>).password
      }

      setCurrentConfig(merged)
      if (merged.experimentType)
        setExperimentType(merged.experimentType)

      if (!appId && !baseSnapshot && !merged.password) {
        addAssistantMessage(
          '已生成应用配置，请设置一个访问密码（实验室成员需要输入此密码才能进入应用）：'
        )
        setWaitingForPassword(true)
      } else if (
        baseSnapshot
        && partial
        && typeof partial === 'object'
        && Object.keys(partial as object).length === 0
      ) {
        addAssistantMessage(
          '当前配置未做修改（模型返回了空更新）。若需要调整表单/页面/图表，请说明具体改动。'
        )
      } else {
        addAssistantMessage('已根据你的需求更新了应用配置，请在右侧预览确认。')
      }

      setStatus('done')
    } catch (err) {
      if (requestId !== llmRequestSeqRef.current) return
      const errMsg = err instanceof Error ? err.message : '生成失败，请重试'
      addAssistantMessage(`生成失败：${errMsg}`)
      setStatus('error', errMsg)
    }
  }, [
    experimentType,
    waitingForPassword,
    appId,
    primarySaveLabel,
    addUserMessage,
    setCurrentConfig,
    addAssistantMessage,
    setStatus,
  ])

  handleSendRef.current = handleSend

  useEffect(() => {
    if (!initMsg || !experimentType || hasAutoSent) return
    setHasAutoSent(true)
    sessionStorage.removeItem('builderInitMsg')
    void handleSendRef.current(initMsg)
  }, [experimentType, initMsg, hasAutoSent])

  useEffect(() => {
    let cancelled = false
    if (appId) {
      void appRepo.getById(appId).then(app => {
        if (cancelled || !app) return
        setCurrentConfig(app)
        setExperimentType(app.experimentType)
      })
    }
    return () => {
      cancelled = true
      reset()
      clearSelection()
    }
  }, [appId, setCurrentConfig, reset, clearSelection])

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

  function patchRunnerOptions(patch: Partial<NonNullable<AppConfig['runnerOptions']>>) {
    if (!currentConfig) return
    setCurrentConfig({
      ...currentConfig,
      runnerOptions: { ...currentConfig.runnerOptions, ...patch },
    })
  }

  function handleBack() {
    reset()
    clearSelection()
    navigate('/')
  }

  function applySceneHint(type: ExperimentType) {
    setExperimentType(type)
    setSceneHintsOpen(false)
    const cfg = useBuilderStore.getState().currentConfig
    if (cfg)
      setCurrentConfig({ ...cfg, experimentType: type })
    message.success(cfg ? '已写入配置的实验类型，后续迭代会参考它' : '首轮生成将侧重此类常见字段')
  }

  if (appId && !experimentType) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fafafa',
      }}>
        <Spin size="large" tip="加载应用配置..." />
      </div>
    )
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
          <Button
            icon={<ArrowLeftOutlined />}
            type="text"
            onClick={handleBack}
            aria-label="返回首页并关闭构建器"
          />
          <Text strong style={{ fontSize: 16 }}>
            {appId ? '迭代应用' : '新建应用'}
          </Text>
          <Button
            icon={<BookOutlined />}
            type="default"
            size="small"
            onClick={() => setSceneHintsOpen(true)}
          >
            领域参考
          </Button>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {SCENE_HINT_LABEL[experimentType]}
          </Text>
          <Button
            icon={<ControlOutlined />}
            type="default"
            size="small"
            onClick={() => setRunnerOptionsOpen(true)}
            disabled={!currentConfig}
          >
            运行选项
          </Button>
        </div>
        <Button
          type="primary"
          icon={<CheckOutlined />}
          loading={confirming}
          onClick={handleConfirm}
          disabled={!currentConfig}
        >
          {primarySaveLabel}
        </Button>
      </Header>

      <Content style={{
        display: 'flex',
        overflow: 'hidden',
        height: 'calc(100vh - 64px)',
      }}>

        <div
          role="region"
          aria-label="构建器左侧：AI 对话与属性编辑"
          style={{
            flex: '0 0 40%',
            borderRight: '1px solid #f0f0f0',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: showProperties ? 'none' : 'flex',
              flexDirection: 'column',
            }}
            id="builder-chat-pane"
          >
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
              <div style={{ flexShrink: 0, padding: '12px 16px 0' }}>
                <Alert
                  type="info"
                  showIcon
                  message="用自然语言主导设计"
                  description="直接说出要记什么字段、要什么页面或流程；AI 按你的描述生成结构。下方「领域参考」只调节提示侧重，不代替对话。"
                  style={{ marginBottom: 8 }}
                />
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ChatPanel
                  messages={messages}
                  loading={loading}
                  onSend={handleSend}
                  waitingForPassword={waitingForPassword}
                  quickPrompts={BUILDER_QUICK_PROMPTS}
                />
              </div>
            </div>
          </div>

          {showProperties && currentConfig && (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="builder-properties-title"
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                background: '#fff',
                zIndex: 10,
              }}
            >
              <div style={{
                padding: '10px 16px',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}>
                <Text id="builder-properties-title" strong style={{ fontSize: 13 }}>
                  属性面板
                </Text>
                <Button
                  ref={propertiesBackRef}
                  size="small"
                  type="text"
                  onClick={clearSelection}
                  aria-label="返回 AI 对话（快捷键 Esc）"
                >
                  ← 返回对话
                </Button>
              </div>

              <div style={{ flex: 1, overflow: 'hidden' }} role="region" aria-label="选中项属性表单">
                <PropertiesPanel
                  config={currentConfig}
                  onConfigChange={handleConfigChange}
                />
              </div>
            </div>
          )}
        </div>

        <div
          role="region"
          aria-label="应用预览与页面结构"
          style={{ flex: '0 0 60%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        >
          {currentConfig && configWarnings.length > 0 && (
            <div style={{ flexShrink: 0, padding: '12px 16px 0', overflow: 'auto' }}>
              <Alert
                type="warning"
                showIcon
                message="配置提示（不影响保存）"
                description={(
                  <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
                    {configWarnings.map(w => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                )}
              />
            </div>
          )}
          {currentConfig ? (
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <AppPreview
                config={currentConfig}
                onConfigChange={handleConfigChange}
              />
            </div>
          ) : (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 0,
            }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="对话后将在此预览生成的应用"
              />
            </div>
          )}
        </div>

      </Content>

      <Modal
        title="领域参考（可选）"
        open={sceneHintsOpen}
        onCancel={() => setSceneHintsOpen(false)}
        footer={null}
        width={720}
        destroyOnClose
        styles={{ body: { maxHeight: '72vh', overflowY: 'auto' } }}
      >
        <ExperimentTypeSelector embedded onSelect={applySceneHint} />
      </Modal>

      <Modal
        title="运行页数据权限"
        open={runnerOptionsOpen}
        onCancel={() => setRunnerOptionsOpen(false)}
        footer={<Button type="primary" onClick={() => setRunnerOptionsOpen(false)}>完成</Button>}
        destroyOnClose
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          控制应用运行页表格是否允许删除单条记录、导出 CSV（保存后生效）。
        </Text>
        {currentConfig && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text>允许删除记录</Text>
              <Switch
                checked={currentConfig.runnerOptions?.allowRecordDelete !== false}
                onChange={v => patchRunnerOptions({ allowRecordDelete: v })}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text>允许导出表格</Text>
              <Switch
                checked={currentConfig.runnerOptions?.allowRecordExport !== false}
                onChange={v => patchRunnerOptions({ allowRecordExport: v })}
              />
            </div>
          </Space>
        )}
      </Modal>
    </Layout>
  )
}
