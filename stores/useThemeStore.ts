import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { z } from 'zod'

export interface ThemeState {
  dark: boolean
  toggle: () => void
}

export const THEME_PERSIST_VERSION = 1
const persistedThemeSchema = z.object({ dark: z.boolean() })

export function migrateThemeState(persistedState: unknown, version: number): { dark: boolean } {
  if (version > THEME_PERSIST_VERSION) return { dark: false }
  const parsed = persistedThemeSchema.safeParse(persistedState)
  return parsed.success ? parsed.data : { dark: false }
}

export const selectDark = (state: ThemeState) => state.dark
export const selectToggleTheme = (state: ThemeState) => state.toggle

const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      dark: false,
      toggle: () => set((s) => ({ dark: !s.dark })),
    }),
    {
      name: 'english-pathway-theme',
      version: THEME_PERSIST_VERSION,
      migrate: migrateThemeState,
    },
  ),
)

export default useThemeStore
