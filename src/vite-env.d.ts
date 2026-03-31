/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 覆盖默认产品名（见 constants/branding.ts） */
  readonly VITE_APP_NAME?: string
  /** 覆盖默认标语 */
  readonly VITE_APP_TAGLINE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
