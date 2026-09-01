import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useAuthStore } from '@/features/auth'
import { getEncryptionKey, setEncryptionKey } from '@/shared/lib/keyStore'
import { useUnlockVault } from './useUnlockVault'

describe('useUnlockVault', () => {
  afterEach(() => {
    setEncryptionKey(null)
    useAuthStore.setState({ user: null, isAuthenticated: false, isSessionLoading: false })
  })

  it('derives and stores an encryption key from the unlock password when a user is signed in', async () => {
    useAuthStore.setState({
      user: { id: 'user-1', phone: '0900000000', fullName: 'Jane Doe', role: 'member' },
      isAuthenticated: true,
      isSessionLoading: false,
    })

    const { result } = renderHook(() => useUnlockVault())

    expect(getEncryptionKey()).toBeNull()

    await act(async () => {
      await result.current.unlock('my-unlock-password')
    })

    await waitFor(() => expect(getEncryptionKey()).not.toBeNull())
    expect(getEncryptionKey()).toMatchObject({ type: 'secret', algorithm: expect.objectContaining({ name: 'AES-GCM' }) })
  })

  it('toggles isUnlocking while deriving the key', async () => {
    useAuthStore.setState({
      user: { id: 'user-1', phone: '0900000000', fullName: 'Jane Doe', role: 'member' },
      isAuthenticated: true,
      isSessionLoading: false,
    })

    const { result } = renderHook(() => useUnlockVault())
    expect(result.current.isUnlocking).toBe(false)

    const unlockPromise = act(async () => {
      await result.current.unlock('my-unlock-password')
    })
    await unlockPromise

    expect(result.current.isUnlocking).toBe(false)
  })

  it('does nothing when there is no signed-in user', async () => {
    const { result } = renderHook(() => useUnlockVault())

    await act(async () => {
      await result.current.unlock('my-unlock-password')
    })

    expect(getEncryptionKey()).toBeNull()
  })
})
