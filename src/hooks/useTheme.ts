import { useEffect } from 'react'
import { useThemeStore } from '../store/themeStore'
import { THEME_KEY } from '../constants/theme'

export default function useTheme() {
  const isDark = useThemeStore((s) => s.isDark)

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'light') {
      useThemeStore.getState().toggle()
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light')
  }, [isDark])
}
