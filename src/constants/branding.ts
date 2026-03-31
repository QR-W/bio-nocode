const name = import.meta.env.VITE_APP_NAME?.trim()
const tag = import.meta.env.VITE_APP_TAGLINE?.trim()

/** 全站对外展示用产品名与标语（可用 VITE_APP_NAME / VITE_APP_TAGLINE 覆盖） */
export const PRODUCT_NAME = name || 'BioForm'
export const PRODUCT_NAME_WITH_EMOJI = `🧬 ${PRODUCT_NAME}`
export const PRODUCT_TAGLINE =
  tag || '基于 LLM 的细胞生物学实验零代码平台'

/** 应用构建器主按钮（新建 / 迭代） */
export const BUILDER_SAVE_LABEL_CREATE = '确认创建应用'
export const BUILDER_SAVE_LABEL_ITERATE = '保存并进入应用'
