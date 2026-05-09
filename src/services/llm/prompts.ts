// src/services/llm/prompts.ts

import type { ExperimentType, AppConfig } from '../../types/AppConfig'

// ─── 领域知识库（基于文献和标准操作规范）────────────────────────
// 参考来源：
// - GCCP 2.0 (Pamies et al., ALTEX 2022) — 细胞培养通用规范
// - Sigma-Aldrich / ECACC 冻存操作规程
// - Dojindo CCK-8 试剂盒说明书
// - Thermo Fisher Lipofectamine 转染指南
// - Bio-Rad / Abcam 流式细胞术门控策略指南

const DOMAIN_KNOWLEDGE: Record<ExperimentType, string> = {

  passage: `
【传代培养实验 — 领域知识】
依据 GCCP 2.0 规范，传代记录必须包含以下核心字段：

必填字段：
- 细胞系名称（如 HeLa、HEK293T、MCF-7、A549）
- 传代次数（正整数，通常在 P1~P50 范围内，超过 P30 需注意遗传漂变）
- 实验日期
- 操作者姓名

强烈推荐字段：
- 接种密度（单位：×10⁶/mL 或 cells/cm²，HeLa 常用 0.5~1×10⁵ cells/cm²）
- 培养基类型（如 DMEM、RPMI-1640、MEM、F-12）
- 血清浓度（%，通常 10%，无血清培养标注 0%）
- 培养时长（天，通常 2~4 天传一次）
- 收获时融合度（%，0~100，建议 80~90% 时传代）
- 收获时活率（%，0~100，健康细胞应 ≥90%，台盼蓝排除法检测）
- 培养瓶规格（T25/T75/T175）

可选字段：
- CO₂浓度（%，通常 5%）
- 培养温度（℃，通常 37℃）
- 消化液（胰蛋白酶/Accutase/EDTA）
- 支原体检测结果（阴性/阳性/未检测）
- 备注（异常形态、污染迹象等）

常用图表：
- 活率随传代次数变化折线图（x: 传代次数, y: 活率%）
- 融合度趋势折线图
- 活率分布柱状图

数值约束：
- 活率正常范围：90%~99%；低于 85% 需记录异常
- 融合度建议传代窗口：75%~90%
- 传代次数：正整数，≥1
  `,

  cryopreservation: `
【冻存与复苏实验 — 领域知识】
依据 ECACC/Sigma-Aldrich 标准冻存规程：

必填字段：
- 细胞系名称
- 操作类型（冻存 / 复苏）
- 操作日期
- 操作者姓名
- 冻存/复苏代数

冻存专用字段：
- 冻存前活率（%，要求 ≥90% 方可冻存，低于此值质量不达标）
- 冻存密度（×10⁶/mL，通常 1~5×10⁶/mL）
- 冻存液配方（如 90% FBS + 10% DMSO，或商业冻存液 CryoStor CS10）
- DMSO 浓度（%，通常 10%，高浓度有细胞毒性）
- 冻存管数（正整数）
- 存储位置（液氮罐编号/层架位置）
- 冷冻速率（℃/min，程序降温仪标准：-1℃/min）
- 最终存储温度（-80℃冰箱 / -196℃液氮气相）

复苏专用字段：
- 复苏后活率（%，合格标准 ≥70%，优秀 ≥85%）
- 复苏后贴壁时间（小时）
- 复苏管编号（与冻存记录对应）
- 解冻方法（37℃水浴/37℃培养箱）

常用图表：
- 复苏后活率分布柱状图
- 冻存前/复苏后活率对比图

数值约束：
- 冻存前活率要求 ≥90%
- 复苏后活率合格线 ≥70%
- DMSO浓度通常 5%~10%
  `,

  transfection: `
【转染实验 — 领域知识】
依据 Thermo Fisher Lipofectamine 官方指南及 Nature Scientific Reports 转染机制研究：

必填字段：
- 细胞系名称
- 转染日期
- 操作者
- 转染方法（脂质体法/电转/磷酸钙法）
- 转染试剂（Lipofectamine 2000/3000/RNAiMAX、Fugene、PEI 等）
- 质粒/siRNA 名称
- 质粒用量（μg/孔 或 μg/mL）
- 转染试剂用量（μL/孔）
- 细胞密度（%融合度，建议 70~90%，或 ×10⁵ cells/孔）
- 检测时间点（转染后小时数，通常 24h/48h/72h）

强烈推荐字段：
- 转染效率（%，通过流式或荧光显微镜评估阳性细胞比例）
- 转染后活率（%，毒性评估）
- 转染质粒类型（过表达/敲低/报告基因）
- 检测方法（流式细胞术/荧光显微镜/WB/qPCR）
- 孔板规格（6孔板/24孔板/96孔板）
- Opti-MEM 用量（μL）

可选字段：
- DNA 纯度（OD 260/280 比值，标准值 1.7~1.9）
- 是否换液（转染后4~6h换液）
- 细胞状态描述

常用图表：
- 不同条件下转染效率对比柱状图
- 转染效率与质粒用量散点图
- 转染效率随时间变化折线图

数值约束：
- 转染效率：0~100%
- 转染后活率：正常应 ≥70%
- DNA/Lipofectamine 比例通常 1:2~1:3（μg:μL）
- DNA 纯度 OD 260/280 应在 1.7~1.9
  `,

  flow_cytometry: `
【流式细胞术分析 — 领域知识】
依据 Bio-Rad/Abcam 流式门控指南及 Scientific Reports 标准化流式研究：

必填字段：
- 细胞系/样本名称
- 检测日期
- 操作者
- 检测目的（细胞周期/凋亡/表面标志物/胞内蛋白）
- 抗体/染料名称（如 AnnexinV-FITC、PI、CD3-PE、BrdU）
- 阳性细胞比例（%，0~100）
- 分析细胞总数（通常 ≥10,000 个细胞/样本）

强烈推荐字段：
- 门控策略描述（如 FSC/SSC → 单细胞 → 活细胞 → 目标群体）
- 检测通道（FITC/PE/APC/BV421 等）
- 对照设置（同型对照/FMO对照/未染色对照）
- 仪器型号（如 BD FACSCanto、BD LSRFortessa）
- 分析软件（FlowJo/CellQuest/FCS Express）
- 特异性群体百分比（各亚群 %）
- MFI（平均荧光强度，选填）

细胞周期专用字段：
- G0/G1期比例（%）
- S期比例（%）
- G2/M期比例（%）
- Sub-G1比例（%，凋亡指示）

凋亡专用字段：
- 早期凋亡细胞比例（AnnexinV+/PI-，%）
- 晚期凋亡/坏死细胞比例（AnnexinV+/PI+，%）
- 存活细胞比例（AnnexinV-/PI-，%）

常用图表：
- 各处理组阳性比例对比柱状图
- 时间序列折线图（随时间或剂量变化）
- 凋亡各期比例堆叠柱状图

数值约束：
- 所有百分比：0~100%
- 细胞周期各期之和应接近 100%
- MFI：正整数，通常在 10²~10⁵ 范围
  `,

  drug_assay: `
【药物活性检测实验（CCK-8/MTT）— 领域知识】
依据 Dojindo CCK-8 官方文档及 Cell Viability Assays（NCBI Bookshelf）：

必填字段：
- 细胞系名称
- 检测日期
- 操作者
- 检测方法（CCK-8 / MTT / MTS / XTT）
- 药物名称
- 药物浓度（μM 或 μg/mL，需设置系列浓度梯度，通常5~7个梯度）
- 处理时长（小时，常用 24h/48h/72h）
- 吸光度值（OD 值，CCK-8 检测波长 450nm，MTT 检测波长 570nm）
- 细胞活力（%，以对照组为 100% 计算）

强烈推荐字段：
- 溶剂对照 OD 值
- 空白对照 OD 值（无细胞，用于背景扣除）
- IC50 值（μM，半数抑制浓度，由剂量-效应曲线计算）
- 药物溶剂（DMSO/PBS/水，DMSO 终浓度通常 ≤0.1%）
- 孔板规格（96孔板为标准格式）
- 每组重复数（建议 ≥3 复孔）
- 铺板密度（cells/孔，96孔板常用 5000~10000 cells/100μL）
- CCK-8/MTT 孵育时间（1~4小时）

可选字段：
- 药物批号
- 阳性对照（已知 IC50 的参考药物）
- 药物作用机制
- 是否含血清（某些情况需无血清处理）

细胞活力计算公式：
细胞活力(%) = (处理组OD - 空白OD) / (对照组OD - 空白OD) × 100%

常用图表：
- 细胞活力随药物浓度变化折线图（x: 对数浓度, y: 活力%）
- 不同药物/处理组 IC50 对比柱状图
- 不同时间点活力变化折线图

数值约束：
- 吸光度：正数，CCK-8 正常范围约 0.1~3.0
- 细胞活力：通常 0~150%（>100% 表示促增殖）
- IC50：正数，单位μM
- DMSO 终浓度：≤0.1%，否则影响结果
  `,

  project: `
【自由 / 综合场景 — 领域知识】
当用户未限定在某一类细胞实验、或描述的是课题台账/混合流程/非细胞业务时，**不要**机械套用下面列表；仅当用户明显在做「多实验进度看板」时可参考：

课题管理（可选参考）— 跨时间段追踪多个实验进展：

必填字段（仅作参考，以用户描述为准）：
- 课题/实验名称
- 记录日期
- 操作者/负责人
- 实验类型（选项：传代培养/冻存复苏/转染/流式分析/药物检测/其他）
- 实验目的（简要描述本次实验的科学问题）
- 主要实验结果（描述关键数据和现象）
- 完成状态（进行中 / 已完成 / 暂停 / 失败）

强烈推荐字段：
- 使用细胞系
- 关键参数（浓度/时间/处理条件等核心变量）
- 数据质量评估（优/良/差/需重复）
- 下一步计划
- 相关文献/参考方案
- 实验花费/试剂批号

可选字段：
- 实验图片附件
- 同组其他成员
- 仪器使用记录
- 生物安全等级
- 课题经费来源

常用图表：
- 各类型实验占比饼图
- 实验状态分布柱状图（进行中/完成/暂停）
- 按月份实验频次折线图
  `,
}

// ─── 系统提示词构建 ───────────────────────────────────────────

function experimentTypeJsonLine(experimentType: ExperimentType): string {
  return experimentType === 'project'
    ? `"experimentType": "<在 JSON 中输出下列之一：passage | cryopreservation | transfection | flow_cytometry | drug_assay | project；以用户真实场景为准，混合/跨类/非细胞实验或未明确时一律用 project>"`
    : `"experimentType": "${experimentType}"`
}

export function buildSystemPrompt(experimentType: ExperimentType): string {
  const freedomBlock = experimentType === 'project'
    ? `
【自由度 — LLM 的核心职责】
- 以用户自然语言为最高优先级：字段、页面数量与命名、导航结构均须服从用户描述；禁止为「套模板」而批量添加用户未提及的字段。
- 若场景不是典型细胞实验（试剂/样本/仪器/动物/通用台账等），仍应忠实实现；experimentType 用 project。
- 下文分类型「领域知识」仅供联想与合理性校验，**不是必选项**；仅当与用户描述相关时才吸收其中要点。
`
    : `
【自由度】
当前侧重的实验类型是「参考系」，不是牢笼：用户在本轮话术里明确要求的内容优先；若用户要求偏离下述领域默认值，以用户为准。
`

  return `
你是一个专业的细胞生物学实验数据管理系统生成助手，专门服务于生物医学实验室的非技术背景科研人员。

你的核心任务：根据用户的自然语言描述，理解其真实数据结构与流程，生成一套可用的数据管理系统配置；必要时结合领域常识做**最小**补全，并在 description 里可简短交代假设。

${freedomBlock}

${DOMAIN_KNOWLEDGE[experimentType]}

生成规范：
1. 字段的 name 必须是英文小写加下划线（如 passage_number、cell_viability）
2. 字段的 label 必须是中文，符合实验室日常使用习惯
3. 必填字段（required: true）仅限于用户流程中真正绕不开的项
4. 数值字段在用户给出数值范围时设置 validation（min/max）；未提及时可省略或给宽松默认
5. 有固定选项的字段使用 select 或 multiselect 类型，options 要完整
6. tableColumns 以用户关心的可见列为准，通常 4~8 列，未强调时再做取舍
7. charts：用户要趋势/对比时配置；用户明确不要图表时可置空数组。每项须含 id（英文唯一标识，如 chart_growth）、title、type（line|bar|scatter|pie）、xField、yField；可选 groupField。xField/yField 必须是 fields 中定义的字段 name，或特殊保留字 "count"（表示按 xField 分组后的记录条数，适用于频次分布、状态分布等聚合图表）

你必须严格按照以下 JSON 格式返回，不要包含任何其他内容：
{
  "name": "应用名称",
  "description": "一句话描述",
  ${experimentTypeJsonLine(experimentType)},
  "cellLine": "细胞系名称（用户未提及则省略）",
  "fields": [ ...字段定义，格式同前... ],
  "views": {
    "tableColumns": ["字段name数组"],
    "charts": []
  },
  "pages": [
    {
      "key": "页面唯一key（英文）",
      "title": "页面标题（中文）",
      "icon": "图标名（从以下选择）",
      "components": [
        {
          "id": "组件唯一id",
          "type": "组件类型",
          "title": "组件标题（可选）",
          "props": {}
        }
      ]
    }
  ]
}

可用图标名：DashboardOutlined | FormOutlined | TableOutlined | BarChartOutlined |
UserOutlined | SearchOutlined | FileOutlined | UploadOutlined | HistoryOutlined

可用组件类型及用途：
- StatsCards：数据统计概览卡片，通常放在首页/概览页
- DataForm：数据录入表单，自动读取 fields 配置生成表单
- DataTable：数据列表表格，支持搜索过滤和删除
- ChartView：图表分析，自动读取 views.charts 配置
- LoginForm：用户登录表单，props 可设置 title/footer
- SearchBar：搜索栏，快速检索记录
- RichTextEditor：富文本编辑器，用于实验笔记/报告撰写
- FileUploader：文件上传区，用于附件管理
- Timeline：时间轴，以时间线方式展示实验历史


pages 设计原则：
1. 【必须】每个应用的第一个页面必须是登录页，配置如下：
   {
     "key": "login",
     "title": "用户登录",
     "icon": "UserOutlined",
     "components": [{ "id": "login_form", "type": "LoginForm" }]
   }
2. 首页（登录后第一个页面）通常放 StatsCards，让用户有数据概览（用户明确不要时可换）
3. 同一页面可以组合多个组件，如"数据管理"页同时放 SearchBar + DataTable
4. 含登录页在内的页面数量由用户描述决定，少至 2～3 页、多至更复杂流程均可
5. 根据用户需求灵活组合、命名与排序页面；可增删组件与整页

布局与样式配置（可选，不需要时省略）：
每个组件支持 style 字段控制外观：
- span: 栅格宽度（1-24），24=整行，12=半行，8=三分之一，6=四分之一
- background: 背景色，如 "#ffffff"、"#F0F9FF"
- border: 边框，如 "1px solid #E5E7EB"
- padding: 内边距（数字，单位px），如 16
- titleColor: 标题颜色，如 "#4F46E5"
- titleSize: 标题字号（数字），如 16

每个页面支持 style 字段：
- background: 页面背景色
- gap: 组件间距（数字，单位px），如 20

布局示例（概览页两列并排）：
{
  "key": "dashboard",
  "title": "数据概览",
  "style": { "background": "#F8F7FF", "gap": 16 },
  "components": [
    {
      "id": "stats_1",
      "type": "StatsCards",
      "layout": { "span": 24 }
    },
    {
      "id": "chart_1",
      "type": "ChartView",
      "title": "活率趋势",
      "style": { "span": 12, "background": "#ffffff", "border": "1px solid #E5E7EB" }
    },
    {
      "id": "chart_2",
      "type": "ChartView",
      "title": "传代分布",
      "style": { "span": 12, "background": "#ffffff", "border": "1px solid #E5E7EB" }
    }
  ]
}

字段类型枚举：text | textarea | number | date | select | multiselect | boolean | file
没有合适图表时 charts 返回空数组 []
没有 options 的字段省略 options 属性
`.trim()
}

// ─── 首次生成提示词 ───────────────────────────────────────────

export const COMPLIANCE_HINT = `
数据记录建议遵循可追溯原则（如谁在何时改了什么）；本工具为实验室自用辅助，重大决策请以机构 SOP / 监管要求为准。
`.trim()

export function buildCreatePrompt(userInput: string): string {
  return `
用户需求：${userInput}

请根据以上需求生成配置。若描述不完整，可先做最小必要缺省，并在 description 中用一句话说明假设，便于用户下一轮继续改。

字段与页面以用户措辞为准，避免「为了丰富而丰富」；只有隐含必要（如日期/编号类）才主动补充。

${COMPLIANCE_HINT}
`.trim()
}

// ─── 迭代修改提示词 ───────────────────────────────────────────

export function buildUpdatePrompt(
  userInput: string,
  currentConfig: AppConfig,
): string {
  return `
当前系统配置：
${JSON.stringify(currentConfig, null, 2)}

用户的修改需求：${userInput}

请在当前配置基础上进行修改，返回**与 AppConfig 结构一致的 JSON 片段**（可合并进现有配置的字段子集）。

常规迭代：只改用户明确提到的部分，未提及的键不要出现在返回结果中，以免误覆盖。

**结构性大改**：若用户要求重做页面架构、替换流程、改成非细胞实验场景、大量增删字段或图表，可返回较多键（含 pages / fields / views 等）以完成目标；不要因「想少改」而保留与用户意图冲突的旧结构。

若经判断**本轮不需要改动任何配置项**（例如用户仅在询问说明、或与改配置无关），请**仅返回空对象** \`{}\`，表示保持当前配置不变。
`.trim()
}