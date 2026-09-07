import { renderHook } from '@testing-library/react-native'
import type { ReactNode } from 'react'
import { useThemeStore } from '../theme.store'
import { darkColors } from '../tokens'
import { ThemeProvider, useTheme } from '../ThemeProvider'

jest.mock('react-native/Libraries/Utilities/useColorScheme')

// eslint-disable-next-line @typescript-eslint/no-require-imports -- RN testing convention for mocking the native color-scheme hook
const useColorScheme: jest.Mock = require('react-native/Libraries/Utilities/useColorScheme').default

function wrapper({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>
}

beforeEach(() => {
  useColorScheme.mockReset()
  useThemeStore.setState({ mode: 'system', hasHydrated: true })
})

describe('ThemeProvider / useTheme', () => {
  it('resolves resolvedScheme from the OS scheme when mode is system', async () => {
    useColorScheme.mockReturnValue('dark')
    useThemeStore.setState({ mode: 'system' })

    const { result } = await renderHook(() => useTheme(), { wrapper })

    expect(result.current.resolvedScheme).toBe('dark')
    expect(result.current.colors).toEqual(darkColors)
  })

  it('lets an explicit mode override win regardless of the OS scheme', async () => {
    useColorScheme.mockReturnValue('light')
    useThemeStore.setState({ mode: 'dark' })

    const { result } = await renderHook(() => useTheme(), { wrapper })

    expect(result.current.resolvedScheme).toBe('dark')
    expect(result.current.colors).toEqual(darkColors)
  })

  it('throws when useTheme is called outside a ThemeProvider', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

    await expect(renderHook(() => useTheme())).rejects.toThrow('useTheme must be used within a ThemeProvider')

    consoleError.mockRestore()
  })
})
