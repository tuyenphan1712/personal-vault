// Mirrors the web client's design tokens exactly (frontend-react-personal-vault/src/index.css)
// so the two clients read as the same product.
export const colors = {
  bg: '#e7e2d5',
  surface: '#ffffff',
  surfaceHover: '#f0e9da',
  primary: '#4e8071',
  primaryDark: '#2c5545',
  primarySoft: '#d6e3dd',
  mist: '#635d57',
  mistSoft: '#f0e9da',
  ink: '#1e1c1a',
  muted: '#726a5f',
  line: '#d3c8b2',
  danger: '#9e4b39',
  dangerDark: '#7a3728',
  dangerSoft: '#f5e1dc',
} as const

export const fonts = {
  serif: 'Newsreader_500Medium',
  serifLight: 'Newsreader_300Light',
  serifSemiBold: 'Newsreader_600SemiBold',
  sans: 'IBMPlexSans_400Regular',
  sansMedium: 'IBMPlexSans_500Medium',
  sansSemiBold: 'IBMPlexSans_600SemiBold',
  mono: 'IBMPlexMono_400Regular',
  monoMedium: 'IBMPlexMono_500Medium',
} as const

export const radii = {
  sm: 9,
  md: 11,
  lg: 12,
  pill: 20,
  circle: 999,
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 24,
} as const
