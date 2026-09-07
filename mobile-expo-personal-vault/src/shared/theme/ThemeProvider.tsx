import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useColorScheme } from 'react-native'
import { useThemeStore, type ThemeMode } from './theme.store'
import { darkColors, fonts, lightColors, radii, spacing, type Colors } from './tokens'

export type ResolvedScheme = 'light' | 'dark'

interface ThemeContextValue {
  colors: Colors
  fonts: typeof fonts
  radii: typeof radii
  spacing: typeof spacing
  mode: ThemeMode
  resolvedScheme: ResolvedScheme
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme()
  const mode = useThemeStore((state) => state.mode)
  const setMode = useThemeStore((state) => state.setMode)

  const resolvedScheme: ResolvedScheme = mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: (resolvedScheme === 'dark' ? darkColors : lightColors) as Colors,
      fonts,
      radii,
      spacing,
      mode,
      resolvedScheme,
      setMode,
    }),
    [resolvedScheme, mode, setMode],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
