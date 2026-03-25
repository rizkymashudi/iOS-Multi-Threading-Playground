import { create } from 'zustand'

interface ThemeStore {
  isDark: boolean
  toggle: () => void
}

export const useThemeStore = create<ThemeStore>((set) => ({
  isDark: true,
  toggle: () =>
    set((state) => {
      const next = !state.isDark
      if (next) {
        document.documentElement.classList.remove('light')
      } else {
        document.documentElement.classList.add('light')
      }
      return { isDark: next }
    }),
}))
