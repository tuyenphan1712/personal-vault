export type ThemeMode = 'light' | 'dark'

export interface ColorPalette {
  colorBg: string
  colorSurface: string
  colorSurfaceHover: string
  colorPrimary: string
  colorPrimaryDark: string
  colorPrimarySoft: string
  colorMist: string
  colorMistSoft: string
  colorInk: string
  colorMuted: string
  colorLine: string
  colorDanger: string
  colorDangerDark: string
  colorDangerSoft: string
}

export const lightPalette: ColorPalette = {
  colorBg: '#f6f4f0',
  colorSurface: '#ffffff',
  colorSurfaceHover: '#efebe5',
  colorPrimary: '#4e8071',
  colorPrimaryDark: '#2c5545',
  colorPrimarySoft: '#d6e3dd',
  colorMist: '#635d57',
  colorMistSoft: '#efebe5',
  colorInk: '#1e1c1a',
  colorMuted: '#837c74',
  colorLine: '#e2ddd5',
  colorDanger: '#9e4b39',
  colorDangerDark: '#7a3728',
  colorDangerSoft: '#f5e1dc',
}

export const darkPalette: ColorPalette = {
  colorBg: '#171614',
  colorSurface: '#201e1b',
  colorSurfaceHover: '#2a2723',
  colorPrimary: '#6b9c86',
  colorPrimaryDark: '#55806c',
  colorPrimarySoft: '#24352d',
  colorMist: '#9c948a',
  colorMistSoft: '#2a2723',
  colorInk: '#f3efe9',
  colorMuted: '#a39a8e',
  colorLine: '#35322c',
  colorDanger: '#c97b64',
  colorDangerDark: '#a85f4a',
  colorDangerSoft: '#3a2521',
}

export const palettes: Record<ThemeMode, ColorPalette> = {
  light: lightPalette,
  dark: darkPalette,
}

const CSS_VAR_NAMES: Record<keyof ColorPalette, string> = {
  colorBg: '--color-bg',
  colorSurface: '--color-surface',
  colorSurfaceHover: '--color-surface-hover',
  colorPrimary: '--color-primary',
  colorPrimaryDark: '--color-primary-dark',
  colorPrimarySoft: '--color-primary-soft',
  colorMist: '--color-mist',
  colorMistSoft: '--color-mist-soft',
  colorInk: '--color-ink',
  colorMuted: '--color-muted',
  colorLine: '--color-line',
  colorDanger: '--color-danger',
  colorDangerDark: '--color-danger-dark',
  colorDangerSoft: '--color-danger-soft',
}

export function applyPalette(mode: ThemeMode) {
  const palette = palettes[mode]
  const root = document.documentElement
  for (const key of Object.keys(palette) as (keyof ColorPalette)[]) {
    root.style.setProperty(CSS_VAR_NAMES[key], palette[key])
  }
  root.dataset.theme = mode
}
