import React, { createContext, useContext, useEffect, useState } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'
export type AccentColor = 'sky' | 'emerald' | 'violet' | 'amber' | 'rose'

interface ThemeContextValue {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  accent: AccentColor
  setAccent: (accent: AccentColor) => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('app_theme') as ThemeMode) || 'light'
  })

  const [accent, setAccentState] = useState<AccentColor>(() => {
    return (localStorage.getItem('app_accent') as AccentColor) || 'sky'
  })

  const [isDark, setIsDark] = useState<boolean>(false)

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme)
    localStorage.setItem('app_theme', newTheme)
  }

  const setAccent = (newAccent: AccentColor) => {
    setAccentState(newAccent)
    localStorage.setItem('app_accent', newAccent)
  }

  useEffect(() => {
    const root = document.documentElement

    // Check system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const resolveDark = () => {
      if (theme === 'dark') return true
      if (theme === 'light') return false
      return mediaQuery.matches
    }

    const dark = resolveDark()
    setIsDark(dark)

    if (dark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    // Set accent attribute
    root.setAttribute('data-accent', accent)

    const listener = () => {
      if (theme === 'system') {
        const sysDark = mediaQuery.matches
        setIsDark(sysDark)
        if (sysDark) root.classList.add('dark')
        else root.classList.remove('dark')
      }
    }

    mediaQuery.addEventListener('change', listener)
    return () => mediaQuery.removeEventListener('change', listener)
  }, [theme, accent])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, accent, setAccent, isDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
