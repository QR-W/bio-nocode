/** 构建器对话区快捷填充（发出后仍走同一套 LLM 流程） */
export const BUILDER_QUICK_PROMPTS: { label: string; prompt: string }[] = [
  {
    label: '非细胞场景',
    prompt:
      '我的场景不是典型细胞培养实验。请按我前面描述的业务重新设计 fields 与 pages，不要机械套用传代/冻存等默认字段；experimentType 用 project 即可。',
  },
  {
    label: '大改结构',
    prompt:
      '请按我下一条消息的要求大幅调整：可增加/删除整页、改名、调整导航顺序与组件搭配；以我说为准，不必保留当前页面数量。',
  },
  {
    label: '加字段',
    prompt: '请在本应用现有结构上增加一个实用字段（类型由你根据场景选择），并同步更新列表列与图表所需引用。',
  },
  {
    label: '加图表',
    prompt: '请在 views.charts 中增加一张合适的图表（折线或柱状），使用已有数值字段；若没有合适数值字段请先补充一个字段。',
  },
  {
    label: '精简',
    prompt: '请精简字段与页面，只保留日常记录最需要的项，去掉很少用的字段。',
  },
  {
    label: '说明页',
    prompt: '请增加一页用于展示实验注意事项或 SOP 摘要（可用 RichText 或简短 Stats/说明组件组合）。',
  },
]
