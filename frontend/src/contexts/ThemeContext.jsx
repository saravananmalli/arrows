import React, { createContext, useContext, useState, useEffect } from 'react'

const STORAGE_KEY = 'arrows-theme'
const ThemeContext = createContext(null)

function getSystemResolved() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveMode(mode) {
  return mode === 'system' ? getSystemResolved() : mode
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem(STORAGE_KEY) || 'light')
  const [theme, setTheme] = useState(() => resolveMode(localStorage.getItem(STORAGE_KEY) || 'light'))

  useEffect(() => {
    const resolved = resolveMode(mode)
    setTheme(resolved)
    document.documentElement.setAttribute('data-theme', resolved)
    localStorage.setItem(STORAGE_KEY, mode)

    if (mode === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => {
        const r = resolveMode('system')
        setTheme(r)
        document.documentElement.setAttribute('data-theme', r)
      }
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [mode])

  const toggle = () => setMode(m => resolveMode(m) === 'light' ? 'dark' : 'light')

  return (
    <ThemeContext.Provider value={{ mode, setMode, theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useThemeContext() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useThemeContext must be inside <ThemeProvider>')
  return ctx
}
