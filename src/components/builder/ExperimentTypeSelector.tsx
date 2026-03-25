import { Card, Row, Col, Typography } from 'antd'
import type { ExperimentType } from '../../types/AppConfig'

const { Title, Text } = Typography

const EXPERIMENT_OPTIONS: { type: ExperimentType; label: string; desc: string }[] = [
  { type: 'passage',           label: '传代培养',       desc: '传代次数、活率、融合度记录' },
  { type: 'cryopreservation',  label: '冻存与复苏',     desc: '冻存条件、复苏活率追踪' },
  { type: 'transfection',      label: '转染实验',       desc: '转染效率、质粒用量记录' },
  { type: 'flow_cytometry',    label: '流式细胞术',     desc: '阳性细胞比例、检测指标' },
  { type: 'drug_assay',        label: '药物活性检测',   desc: 'CCK-8、MTT 吸光度与活力' },
  { type: 'project',           label: '课题管理',       desc: '长期实验进度与结果追踪' },
]

interface Props {
  onSelect: (type: ExperimentType) => void
}

export default function ExperimentTypeSelector({ onSelect }: Props) {
  return (
    <div style={{ maxWidth: 680, margin: '60px auto', padding: '0 24px' }}>
      <Title level={3} style={{ textAlign: 'center', marginBottom: 8 }}>
        选择实验类型
      </Title>
      <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 32 }}>
        根据你的实验场景选择，系统会自动推荐合适的字段
      </Text>

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
    </div>
  )
}