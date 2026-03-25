import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  apiKey:  string
  model:   string
  baseURL: string

  setApiKey:  (key: string)   => void
  setModel:   (model: string) => void
  setBaseURL: (url: string)   => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiKey:  '',
      model:   'gpt-4o',
      baseURL: '',

      setApiKey:  (apiKey)  => set({ apiKey }),
      setModel: (model) => {
        const baseURLMap: Record<string, string> = {
          'deepseek-chat': 'https://api.deepseek.com/v1',
        }
        set({
          model,
          baseURL: baseURLMap[model] ?? '',
        })
      },
      setBaseURL: (baseURL) => set({ baseURL }),
    }),
    {
      name: 'nocode-settings', // localStorage 里的 key 名
    },
  ),
)

// 供设置页下拉选择用
export const SUPPORTED_MODELS = [
  { label: 'GPT-4o',                    value: 'gpt-4o'                     },
  { label: 'GPT-4o mini',               value: 'gpt-4o-mini'                },
  { label: 'Claude 3.5 Sonnet',         value: 'claude-3-5-sonnet-20241022' },
  { label: 'Gemini 3.0',                value: 'gemini-3.0'           },
  { label: 'DeepSeek V3',               value: 'deepseek-chat'              },
]
  