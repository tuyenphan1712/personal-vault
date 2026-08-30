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
  colorBg: '#e7e2d5',
  colorSurface: '#ffffff',
  colorSurfaceHover: '#f0e9da',
  colorPrimary: '#4e8071',
  colorPrimaryDark: '#2c5545',
  colorPrimarySoft: '#d6e3dd',
  colorMist: '#635d57',
  colorMistSoft: '#f0e9da',
  colorInk: '#1e1c1a',
  colorMuted: '#726a5f',
  colorLine: '#d3c8b2',
  colorDanger: '#9e4b39',
  colorDangerDark: '#7a3728',
  colorDangerSoft: '#f5e1dc',
}

export const darkPalette: ColorPalette = {
  colorBg: '#1c1914',
  colorSurface: '#2e2820',
  colorSurfaceHover: '#3a3226',
  colorPrimary: '#79ac93',
  colorPrimaryDark: '#5c8a72',
  colorPrimarySoft: '#354a3d',
  colorMist: '#c2b7a4',
  colorMistSoft: '#3a3226',
  colorInk: '#f2ede4',
  colorMuted: '#a89d8c',
  colorLine: '#4d4433',
  colorDanger: '#d2836a',
  colorDangerDark: '#ad6650',
  colorDangerSoft: '#4d3023',
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
