import AsyncStorage from '@react-native-async-storage/async-storage'
import { waitFor } from '@testing-library/react-native'
import { useBiometricStore } from '../biometric.store'

const STORAGE_KEY = 'vault-biometric-login'

beforeEach(async () => {
  await AsyncStorage.clear()
  useBiometricStore.setState({ enabled: false })
})

describe('useBiometricStore', () => {
  it('defaults to disabled', () => {
    expect(useBiometricStore.getState().enabled).toBe(false)
  })

  it('updates state when setEnabled is called', () => {
    useBiometricStore.getState().setEnabled(true)

    expect(useBiometricStore.getState().enabled).toBe(true)
  })

  it('persists the flag to AsyncStorage under the vault-biometric-login key and round-trips it', async () => {
    useBiometricStore.getState().setEnabled(true)

    await waitFor(async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY)
      expect(raw).not.toBeNull()
      expect(JSON.parse(raw as string).state.enabled).toBe(true)
    })
  })
})
