import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ThemeState {
  dark: boolean
  toggle: () => void
}

function applyDarkClass(dark: boolean) {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', dark)
  }
}

const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      dark: false,
      toggle: () =>
        set((s) => {
          const next = !s.dark
          applyDarkClass(next)
          return { dark: next }
        }),
    }),
    {
      name: 'english-pathway-theme',
      onRehydrateStorage: () => (state) => {
        if (state?.dark) applyDarkClass(true)
      },
    },
  ),
)

export default useThemeStore
