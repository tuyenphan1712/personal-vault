import { renderHook, waitFor } from '@testing-library/react-native'
import { useAuthStore } from '@/src/features/auth'
import { getEncryptionKey, setEncryptionKey } from '@/src/shared/lib/crypto/keyStore'
import { useUnlockVault } from '../useUnlockVault'

beforeEach(() => {
  setEncryptionKey(null)
  useAuthStore.setState({
    user: { id: 'user-1', phone: '0900000000', fullName: 'Nguyen Van A', role: 'member' },
    isAuthenticated: true,
    isSessionLoading: false,
    isAppLocked: false,
  })
})

describe('useUnlockVault', () => {
  it('derives and stores the encryption key for the current user', async () => {
    const { result } = await renderHook(() => useUnlockVault())

    result.current.unlock('the-login-password')

    await waitFor(() => expect(getEncryptionKey()).not.toBeNull(), { timeout: 5000 })
    expect(getEncryptionKey()).toHaveLength(32)
  })

  it('does nothing when there is no authenticated user', async () => {
    useAuthStore.setState({ user: null, isAuthenticated: false, isSessionLoading: false, isAppLocked: false })
    const { result } = await renderHook(() => useUnlockVault())

    await result.current.unlock('the-login-password')

    expect(getEncryptionKey()).toBeNull()
  })
})
