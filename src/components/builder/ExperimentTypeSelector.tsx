import { Card, Row, Col, Typography, Alert } from 'antd'
import { COMPLIANCE_HINT } from '../../services/llm/prompts'
import type { ExperimentType } from '../../types/AppConfig'

const { Title, Text } = Typography

const EXPERIMENT_OPTIONS: { type: ExperimentType; label: string; desc: string }[] = [
  { type: 'passage',           label: '传代培养',       desc: '传代次数、活率、融合度记录' },
  { type: 'cryopreservation',  label: '冻存与复苏',     desc: '冻存条件、复苏活率追踪' },
  { type: 'transfection',      label: '转染实验',       desc: '转染效率、质粒用量记录' },
  { type: 'flow_cytometry',    label: '流式细胞术',     desc: '阳性细胞比例、检测指标' },
  { type: 'drug_assay',        label: '药物活性检测',   desc: 'CCK-8、MTT 吸光度与活力' },
  { type: 'project',           label: '自由描述',       desc: '不限定模板，对话主导设计' },
]

interface Props {
  onSelect: (type: ExperimentType) => void
  /** 构建器弹层内使用：紧凑布局，不重复大标题与合规长文 */
  embedded?: boolean
}

export default function ExperimentTypeSelector({ onSelect, embedded }: Props) {
  const wrapStyle = embedded
    ? { maxWidth: '100%', margin: 0, padding: 0 }
    : { maxWidth: 680, margin: '60px auto', padding: '0 24px' }

  return (
    <div style={wrapStyle}>
      {!embedded && (
        <>
          <Title level={3} style={{ textAlign: 'center', marginBottom: 8 }}>
            选择实验类型
          </Title>
          <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 32 }}>
            可选：给 AI 一点领域联想；跳过本页则默认由对话自由推断
          </Text>
        </>
      )}
      {embedded && (
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          点选一类以丰富<strong>首轮</strong>系统提示中的领域知识；随时可在对话里改稿或选用「自由描述」。
        </Text>
      )}

      <Row gutter={[16, 16]}>
        {EXPERIMENT_OPTIONS.map(opt => (
          <Col span={8} key={opt.type}>
            <Card
              hoverable
              onClick={() => onSelect(opt.type)}
              style={{ textAlign: 'center', cursor: 'pointer' }}
            >
              <Text strong style={{ fontSize: 15 }}>{opt.label}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>{opt.desc}</Text>
            </Card>
          </Col>
        ))}
      </Row>

      {!embedded && (
        <Alert
          type="info"
          showIcon
          message="合规与使用说明"
          description={COMPLIANCE_HINT}
          style={{ marginTop: 28 }}
        />
      )}
    </div>
  )
}