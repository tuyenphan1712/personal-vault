import { create } from 'zustand'
import { applyPalette, type ThemeMode } from './palettes'

const STORAGE_KEY = 'vault-theme-mode'

function getInitialMode(): ThemeMode {
  return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light'
}

const initialMode = getInitialMode()
applyPalette(initialMode)

interface ThemeState {
  mode: ThemeMode
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: initialMode,
  toggleTheme: () => {
    const next: ThemeMode = get().mode === 'light' ? 'dark' : 'light'
    applyPalette(next)
    localStorage.setItem(STORAGE_KEY, next)
    set({ mode: next })
  },
}))
