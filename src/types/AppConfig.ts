// ─── 1. 实验类型枚举（领域边界）─────────────────────────────────
// 这六类覆盖细胞生物学实验室核心场景
// 后续 appGenerator 的提示词会根据此字段注入对应领域知识

// ─── 组件类型枚举 ─────────────────────────────────────────────

export type ComponentType =
  | 'DataForm'        // 数据录入表单（依赖 fields）
  | 'DataTable'       // 数据列表表格（依赖 fields）
  | 'StatsCards'      // 统计卡片
  | 'ChartView'       // 图表（依赖 charts）
  | 'LoginForm'       // 登录表单
  | 'SearchBar'       // 搜索栏
  | 'RichTextEditor'  // 富文本编辑器
  | 'FileUploader'    // 文件上传区
  | 'Timeline'        // 时间轴（依赖记录数据）

export type ExperimentType =
  | 'passage'            // 传代培养
  | 'cryopreservation'   // 冻存与复苏
  | 'transfection'       // 转染与转染效率检测
  | 'flow_cytometry'     // 流式细胞术分析
  | 'drug_assay'         // 药物处理与活性检测（CCK-8、MTT）
  | 'project'            // 长期实验课题管理

// ─── 2. 字段类型 ─────────────────────────────────────────────────

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'boolean'
  | 'file'

// ─── 3. 字段校验规则 ─────────────────────────────────────────────

export interface FieldValidation {
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
}

// ─── 4. 单个字段定义 ─────────────────────────────────────────────

export interface FieldDef {
  name: string          // 英文 key，用于数据存储，如 "passage_number"
  label: string         // 中文显示名，如 "传代次数"
  type: FieldType
  required?: boolean
  placeholder?: string
  unit?: string         // 单位，如 "%"、"×10⁶/mL"、"天"
  options?: string[]    // 仅 select / multiselect 使用
  validation?: FieldValidation
  defaultValue?: unknown
  helpText?: string     // 字段说明，显示在表单项下方
  inputStyle?: FieldInputStyle
}

// 组件样式配置
export interface ComponentStyle {
  span?: number   // 栅格宽度，1-24
  background?: string   // 背景色，如 "#ffffff"
  border?: string   // 边框，如 "1px solid #e5e7eb"
  padding?: number   // 内边距 px
  titleColor?: string   // 标题颜色
  titleSize?: number   // 标题字号
}

// 页面样式配置
export interface PageStyle {
  background?: string   // 页面背景色
  gap?: number   // 组件间距
}

// 新增字段输入框样式接口
export interface FieldInputStyle {
  width?: number   // 占表单列的百分比，如 50 = 半列
  borderColor?: string   // 边框颜色，如 "#4F46E5"
  borderRadius?: number  // 圆角，如 8
  borderWidth?: number   // 边框粗细，如 2
  background?: string   // 背景色
  fontSize?: number   // 字体大小
  color?: string   // 字体颜色
  rows?: number   // textarea 行数
  padding?: number   // 内边距
}

// ─── 单个组件配置 ─────────────────────────────────────────────

export interface ComponentConfig {
  id: string           // 组件唯一标识，如 "form_1"
  type: ComponentType
  title?: string          // 组件标题（可选，如 "实验数据录入"）
  props?: Record<string, unknown>  // 组件额外参数
  style?: ComponentStyle
}

// ─── 页面配置 ─────────────────────────────────────────────────

export interface PageConfig {
  key: string            // 路由 key，如 "dashboard"、"input"
  title: string            // 页面标题，如 "数据概览"
  icon?: string            // 图标名（对应 antd icons）
  components: ComponentConfig[] // 该页面包含哪些组件，按顺序渲染
  style?: PageStyle
}



// ─── 5. 图表配置 ─────────────────────────────────────────────────

export type ChartType = 'line' | 'bar' | 'scatter' | 'pie'

export interface ChartConfig {
  id: string            // 唯一标识，迭代修改时用于定位具体图表
  title: string         // 图表标题，如 "活率随代数变化趋势"
  type: ChartType
  xField: string        // 对应 FieldDef.name
  yField: string        // 对应 FieldDef.name
  groupField?: string   // 分组着色字段，折线图/柱状图可选
}

// ─── 6. 视图配置 ─────────────────────────────────────────────────

export interface ViewConfig {
  tableColumns: string[]  // 列表页显示哪些字段（FieldDef.name 数组）
  defaultSort?: {
    field: string
    order: 'asc' | 'desc'
  }
  charts: ChartConfig[]   // 不设为 optional，默认空数组
}

// ─── 7. AppConfig 主体 ───────────────────────────────────────────

export interface AppConfig {
  id: string
  name: string
  description: string
  experimentType: ExperimentType
  cellLine?: string
  fields: FieldDef[]
  password?: string
  views: ViewConfig
  pages: PageConfig[]   // ← 新增：页面配置
  createdAt: string
  updatedAt: string
  version: number
  userId: string   // 所属用户 ID
}

// ─── 8. 用户填写的数据记录 ───────────────────────────────────────

export interface DataRecord {
  id: string
  appId: string
  data: Record<string, unknown>   // 结构由对应 AppConfig.fields 决定
  createdAt: string
  updatedAt: string
}

// ─── 9. 迭代时 LLM 返回的局部更新 ───────────────────────────────

export type PartialAppConfig = Partial <
Omit < AppConfig, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'version' >
>