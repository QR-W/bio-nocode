import { Row, Col } from 'antd'
import type { PageConfig } from '../../types/AppConfig'
import type { WidgetProps } from '../widgets/types'
import DataFormWidget from '../widgets/DataForm'
import DataTableWidget from '../widgets/DataTable'
import StatsCardsWidget from '../widgets/StatsCards'
import ChartViewWidget from '../widgets/ChartView'
import LoginFormWidget from '../widgets/LoginForm'
import SearchBarWidget from '../widgets/SearchBar'
import RichTextEditorWidget from '../widgets/RichTextEditor'
import FileUploaderWidget from '../widgets/FileUploader'
import TimelineWidget from '../widgets/Timeline'
import { Typography } from 'antd'

const { Text } = Typography

const WIDGET_REGISTRY: Record<string, React.ComponentType<WidgetProps>> = {
    DataForm: DataFormWidget,
    DataTable: DataTableWidget,
    StatsCards: StatsCardsWidget,
    ChartView: ChartViewWidget,
    LoginForm: LoginFormWidget,
    SearchBar: SearchBarWidget,
    RichTextEditor: RichTextEditorWidget,
    FileUploader: FileUploaderWidget,
    Timeline: TimelineWidget,
}

interface Props extends WidgetProps {
    page: PageConfig
    onLogin?: (password: string, username?: string) => boolean
}

export default function PageRenderer({ page, onLogin, ...widgetProps }: Props) {
    const pageStyle = page.style ?? {}

    return (
        <div style={{
            background: pageStyle.background ?? 'transparent',
        }}>
            <Row gutter={[pageStyle.gap ?? 20, pageStyle.gap ?? 20]}>
                {page.components.map(comp => {
                    const Widget = WIDGET_REGISTRY[comp.type]
                    const style = comp.style ?? {}
                    const span = style.span ?? 24

                    if (!Widget) {
                        return (
                            <Col span={span} key={comp.id}>
                                <div style={{
                                    padding: 16,
                                    background: '#FFF7ED',
                                    borderRadius: 8,
                                    border: '1px solid #FED7AA',
                                }}>
                                    <Text type="warning">组件 "{comp.type}" 暂未支持</Text>
                                </div>
                            </Col>
                        )
                    }

                    return (
                        <Col span={span} key={comp.id}>
                            <div style={{
                                background: style.background,
                                border: style.border,
                                padding: style.padding,
                                borderRadius: style.border ? 8 : undefined,
                                height: '100%',
                            }}>
                                <Widget
                                    {...widgetProps}
                                    onLogin={onLogin}
                                    props={{
                                        ...comp.props,
                                        title: comp.title,
                                        titleColor: style.titleColor,
                                        titleSize: style.titleSize,
                                    }}
                                />
                            </div>
                        </Col>
                    )
                })}
            </Row>
        </div>
    )
}