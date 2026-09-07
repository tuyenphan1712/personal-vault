import AsyncStorage from '@react-native-async-storage/async-storage'
import { useThemeStore } from '../theme.store'

const STORAGE_KEY = 'vault-theme-mode'

function waitFor(assertion: () => void | Promise<void>, timeoutMs = 2000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    const tick = async () => {
      try {
        await assertion()
        resolve()
      } catch (error) {
        if (Date.now() - start > timeoutMs) {
          reject(error)
          return
        }
        setTimeout(tick, 10)
      }
    }
    tick()
  })
}

beforeEach(async () => {
  await AsyncStorage.clear()
  useThemeStore.setState({ mode: 'system', hasHydrated: false })
})

describe('useThemeStore', () => {
  it('defaults to system mode', () => {
    expect(useThemeStore.getState().mode).toBe('system')
  })

  it('updates state when setMode is called', () => {
    useThemeStore.getState().setMode('dark')

    expect(useThemeStore.getState().mode).toBe('dark')
  })

  it('persists the mode to AsyncStorage under the vault-theme-mode key and round-trips it', async () => {
    useThemeStore.getState().setMode('dark')

    await waitFor(async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY)
      expect(raw).not.toBeNull()
      expect(JSON.parse(raw as string).state.mode).toBe('dark')
    })

    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    const parsed = JSON.parse(raw as string)
    expect(parsed.state.mode).toBe('dark')
  })

  it('flips hasHydrated to true after rehydration', async () => {
    expect(useThemeStore.getState().hasHydrated).toBe(false)

    await useThemeStore.persist.rehydrate()

    expect(useThemeStore.getState().hasHydrated).toBe(true)
  })
})
