import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  apiKey: string
  /** 留空则使用 DeepSeek 官方 API 根地址；需兼容代理时可填自定义根地址 */
  baseURL: string

  setApiKey: (key: string) => void
  setBaseURL: (url: string) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiKey: '',
      baseURL: '',

      setApiKey: (apiKey) => set({ apiKey }),
      setBaseURL: (baseURL) => set({ baseURL }),
    }),
    {
      name: 'nocode-settings',
    },
  ),
)
