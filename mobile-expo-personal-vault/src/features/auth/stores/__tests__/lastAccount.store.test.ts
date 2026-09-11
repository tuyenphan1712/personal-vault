import AsyncStorage from '@react-native-async-storage/async-storage'
import { waitFor } from '@testing-library/react-native'
import { useLastAccountStore } from '../lastAccount.store'

const STORAGE_KEY = 'vault-last-account'

beforeEach(async () => {
  await AsyncStorage.clear()
  useLastAccountStore.setState({ phone: null, hasHydrated: false })
})

describe('useLastAccountStore', () => {
  it('defaults to no remembered phone', () => {
    expect(useLastAccountStore.getState().phone).toBeNull()
  })

  it('updates state when setPhone is called', () => {
    useLastAccountStore.getState().setPhone('0900000000')

    expect(useLastAccountStore.getState().phone).toBe('0900000000')
  })

  it('persists the phone to AsyncStorage under the vault-last-account key and round-trips it', async () => {
    useLastAccountStore.getState().setPhone('0900000000')

    await waitFor(async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY)
      expect(raw).not.toBeNull()
      expect(JSON.parse(raw as string).state.phone).toBe('0900000000')
    })
  })

  it('flips hasHydrated to true after rehydration', async () => {
    expect(useLastAccountStore.getState().hasHydrated).toBe(false)

    await useLastAccountStore.persist.rehydrate()

    expect(useLastAccountStore.getState().hasHydrated).toBe(true)
  })
})
