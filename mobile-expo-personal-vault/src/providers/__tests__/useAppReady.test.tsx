import { renderHook, waitFor } from '@testing-library/react-native'
import { useThemeStore } from '@/src/shared/theme/theme.store'
import { useAppReady } from '../useAppReady'

jest.mock('@/src/shared/i18n', () => ({
  loadPersistedLanguage: jest.fn().mockResolvedValue(undefined),
}))

import { loadPersistedLanguage } from '@/src/shared/i18n'

beforeEach(() => {
  jest.clearAllMocks()
  useThemeStore.setState({ mode: 'system', hasHydrated: false })
})

describe('useAppReady', () => {
  it('stays not ready while fontsLoaded is false, even after theme/i18n settle', async () => {
    const { result } = await renderHook(() => useAppReady(false))

    useThemeStore.setState({ hasHydrated: true })
    await waitFor(() => expect(loadPersistedLanguage).toHaveBeenCalledTimes(1))

    expect(result.current).toBe(false)
  })

  it('becomes ready once fonts are loaded and both theme and i18n have settled', async () => {
    useThemeStore.setState({ hasHydrated: true })

    const { result } = await renderHook(() => useAppReady(true))

    await waitFor(() => expect(result.current).toBe(true))
  })
})
