import { useState } from 'react'
import { Layout, Menu, Typography, Button } from 'antd'
import {
    DashboardOutlined, FormOutlined, TableOutlined,
    BarChartOutlined, UserOutlined, SearchOutlined,
    FileOutlined, UploadOutlined, HistoryOutlined,
    SettingOutlined, HolderOutlined,
} from '@ant-design/icons'
import {
    DndContext, closestCenter,
    KeyboardSensor, PointerSensor,
    useSensor, useSensors,
    type DragEndEvent,
} from '@dnd-kit/core'
import {
    SortableContext, sortableKeyboardCoordinates,
    rectSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type {
    AppConfig, DataRecord,
    ComponentConfig, PageConfig,
} from '../../types/AppConfig'
import PageRenderer from '../engine/PageRenderer'
import EditableFormPreview from '../builder/EditableFormPreview'
import { useEditorStore } from '../editor/useEditorStore'

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

// ── 可拖拽组件包装器 ──────────────────────────────────────────

function SortableComponent({
    comp,
    currentPage,
    config,
    records,
    hoveredComp,
    setHoveredComp,
    onSelectComponent,
    onConfigChange,
}: {
    comp: ComponentConfig
    currentPage: PageConfig
    config: AppConfig
    records: DataRecord[]
    hoveredComp: string | null
    setHoveredComp: (id: string | null) => void
    onSelectComponent: (comp: ComponentConfig) => void
    onConfigChange: (config: AppConfig) => void
}) {
    const {
        attributes, listeners, setNodeRef,
        transform, transition, isDragging,
    } = useSortable({ id: comp.id })

    const span = comp.style?.span ?? 24
    const gap = currentPage.style?.gap ?? 16
    const width = `calc(${(span / 24) * 100}% - ${gap / 2}px)`

    return (
        <div
            ref={setNodeRef}
            style={{
                width,
                position: 'relative',
                transform: CSS.Transform.toString(transform),
                transition,
                opacity: isDragging ? 0.5 : 1,
                outline: hoveredComp === comp.id
                    ? '2px solid #4F46E5'
                    : '2px solid transparent',
                borderRadius: 8,
                cursor: 'pointer',
            }}
            onMouseEnter={() => setHoveredComp(comp.id)}
            onMouseLeave={() => setHoveredComp(null)}
            onClick={(e) => {
                e.stopPropagation()
                onSelectComponent(comp)
            }}
        >
            {/* hover 时显示操作按钮 */}
            {hoveredComp === comp.id && (
                <div style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    zIndex: 10,
                    display: 'flex',
                    gap: 4,
                }}>
                    {/* 拖拽手柄 */}
                    <Button
                        size="small"
                        icon={<HolderOutlined />}
                        style={{ cursor: 'grab' }}
                        onClick={e => e.stopPropagation()}
                        {...attributes}
                        {...listeners}
                    />
                    {/* 样式编辑 */}
                    <Button
                        size="small"
                        type="primary"
                        icon={<SettingOutlined />}
                        onClick={(e) => {
                            e.stopPropagation()
                            onSelectComponent(comp)
                        }}
                    >
                        编辑
                    </Button>
                </div>
            )}

            {/* 组件内容 */}
            {comp.type === 'DataForm' ? (
                <EditableFormPreview
                    config={config}
                    onConfigChange={onConfigChange}
                    submitText={comp.props?.submitText as string | undefined}
                />
            ) : (
                <PageRenderer
                    page={{ ...currentPage, components: [comp] }}
                    config={config}
                    records={records}
                />
            )}
        </div>
    )
}

// ── 主组件 ───────────────────────────────────────────────────

interface Props {
    config: AppConfig
    records?: DataRecord[]
    onConfigChange?: (config: AppConfig) => void
}

export default function AppPreview({
    config, records = [], onConfigChange
}: Props) {
    const isEditMode = Boolean(onConfigChange)

    const { selectComponent, selectPage, clearSelection } = useEditorStore()

    const [activeKey, setActiveKey] = useState(
        config.pages.find(p => !p.components.some(c => c.type === 'LoginForm'))?.key
        ?? config.pages[0]?.key
        ?? 'dashboard'
    )
    const [hoveredComp, setHoveredComp] = useState<string | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const currentPage = config.pages.find(p => p.key === activeKey)
        ?? config.pages[0]

    const menuItems = config.pages
        .filter(p => !p.components.some(c => c.type === 'LoginForm'))
        .map(page => ({
            key: page.key,
            icon: ICON_MAP[page.icon ?? ''] ?? <FileOutlined />,
            label: page.title,
        }))

    function handleDragEnd(event: DragEndEvent) {
        if (!onConfigChange || !currentPage) return
        const { active, over } = event
        if (!over || active.id === over.id) return

        const oldIndex = currentPage.components.findIndex(c => c.id === active.id)
        const newIndex = currentPage.components.findIndex(c => c.id === over.id)
        const newComponents = arrayMove(currentPage.components, oldIndex, newIndex)

        const newPages = config.pages.map(p =>
            p.key === currentPage.key
                ? { ...p, components: newComponents }
                : p
        )
        onConfigChange({ ...config, pages: newPages })
    }

    return (
        <Layout style={{
            height: '100%',
            border: '1px solid #f0f0f0',
            borderRadius: 8,
            overflow: 'hidden',
        }}>

            {/* 左侧导航 */}
            <Sider
                width={160}
                style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}
            >
                <div style={{ padding: '16px 12px 8px' }}>
                    <Title
                        level={5}
                        style={{ margin: 0, fontSize: 13 }}
                        ellipsis={{ tooltip: config.name }}
                    >
                        {config.name}
                    </Title>
                    {config.cellLine && (
                        <Text type="secondary" style={{ fontSize: 11 }}>
                            {config.cellLine}
                        </Text>
                    )}
                </div>

                <Menu
                    mode="inline"
                    selectedKeys={[activeKey]}
                    onClick={({ key }) => {
                        setActiveKey(key)
                        clearSelection()
                    }}
                    style={{ border: 'none', fontSize: 13 }}
                    items={menuItems}
                />
            </Sider>

            {/* 右侧内容区 */}
            <Layout>
                <Header style={{
                    background: '#fff',
                    borderBottom: '1px solid #f0f0f0',
                    padding: '0 16px',
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <Text strong style={{ fontSize: 13 }}>
                        {currentPage?.title}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                        {isEditMode ? '编辑模式 · 点击组件编辑属性' : '预览模式'}
                    </Text>
                </Header>

                {/* 页面内容 */}
                <Content
                    style={{
                        padding: 12,
                        overflowY: 'auto',
                        background: currentPage?.style?.background ?? '#F8F7FF',
                    }}
                    onClick={() => {
                        if (isEditMode && currentPage) selectPage(currentPage)
                    }}
                >
                    {isEditMode && currentPage ? (
                        // 编辑模式：可拖拽排序
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={currentPage.components.map(c => c.id)}
                                strategy={rectSortingStrategy}
                            >
                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: currentPage.style?.gap ?? 16,
                                }}>
                                    {currentPage.components.map(comp => (
                                        <SortableComponent
                                            key={comp.id}
                                            comp={comp}
                                            currentPage={currentPage}
                                            config={config}
                                            records={records}
                                            hoveredComp={hoveredComp}
                                            setHoveredComp={setHoveredComp}
                                            onSelectComponent={(c) => selectComponent(c, currentPage)}
                                            onConfigChange={onConfigChange!}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    ) : (
                        // 非编辑模式：正常渲染
                        currentPage && (
                            <PageRenderer
                                page={currentPage}
                                config={config}
                                records={records}
                            />
                        )
                    )}
                </Content>
            </Layout>
        </Layout>
    )
}