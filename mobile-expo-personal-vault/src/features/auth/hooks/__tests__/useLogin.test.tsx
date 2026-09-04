import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react-native'
import type { ReactNode } from 'react'
import { server } from '@/src/shared/testing/msw/server'
import { createTestQueryClient } from '@/src/shared/testing/queryClient'
import { getAccessToken, setAccessToken } from '@/src/shared/lib/auth/tokenStore'
import * as cryptoAdapter from '@/src/shared/lib/crypto/cryptoAdapter'
import { getEncryptionKey, setEncryptionKey, useIsDerivingKey } from '@/src/shared/lib/crypto/keyStore'
import { useAuthStore } from '../../stores/auth.store'
import { useLogin } from '../useLogin'
import { loginSuccessHandler, VALID_PASSWORD, VALID_PHONE, currentUserFixture } from './mocks/authHandlers'

jest.mock('@/src/shared/lib/storage/secureStorage', () => ({
  setRefreshToken: jest.fn().mockResolvedValue(undefined),
  getRefreshToken: jest.fn().mockResolvedValue(null),
  clearRefreshToken: jest.fn().mockResolvedValue(undefined),
}))

import { setRefreshToken } from '@/src/shared/lib/storage/secureStorage'

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = createTestQueryClient()
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

beforeEach(() => {
  setAccessToken(null)
  setEncryptionKey(null)
  useAuthStore.setState({ user: null, isAuthenticated: false, isSessionLoading: false, isAppLocked: false })
  jest.clearAllMocks()
})

describe('useLogin', () => {
  it('stores the access token, persists the refresh token, derives the encryption key, and sets the session on success', async () => {
    server.use(loginSuccessHandler)
    const { result } = await renderHook(() => useLogin(), { wrapper })

    result.current.mutate({ phone: VALID_PHONE, password: VALID_PASSWORD })

    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 5000 })

    expect(getAccessToken()).toBe('access-token-1')
    expect(setRefreshToken).toHaveBeenCalledWith('refresh-token-1')
    expect(useAuthStore.getState().user).toEqual(currentUserFixture)
    expect(useAuthStore.getState().isAuthenticated).toBe(true)

    const key = getEncryptionKey()
    expect(key).toBeInstanceOf(Uint8Array)
    expect(key).toHaveLength(32)
  })

  it('derives the same key for the same password and user id (deterministic, nothing persisted)', async () => {
    server.use(loginSuccessHandler)
    const { result } = await renderHook(() => useLogin(), { wrapper })

    result.current.mutate({ phone: VALID_PHONE, password: VALID_PASSWORD })
    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 5000 })
    const firstKey = getEncryptionKey()

    setEncryptionKey(null)
    result.current.mutate({ phone: VALID_PHONE, password: VALID_PASSWORD })
    await waitFor(() => expect(getEncryptionKey()).not.toBeNull(), { timeout: 5000 })
    const secondKey = getEncryptionKey()

    expect(secondKey).toEqual(firstKey)
  })

  it('sets the session as soon as sign-in succeeds, without waiting for the slower key derivation', async () => {
    server.use(loginSuccessHandler)
    let resolveDerive!: (key: Uint8Array) => void
    const deriveSpy = jest
      .spyOn(cryptoAdapter, 'deriveEncryptionKey')
      .mockImplementation(() => new Promise((resolve) => { resolveDerive = resolve }))

    const { result } = await renderHook(() => useLogin(), { wrapper })
    result.current.mutate({ phone: VALID_PHONE, password: VALID_PASSWORD })

    await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(true))
    // Session is active but the key derivation (mocked to hang) hasn't resolved yet.
    expect(getEncryptionKey()).toBeNull()
    expect(result.current.isSuccess).toBe(false)

    resolveDerive(new Uint8Array(32))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getEncryptionKey()).not.toBeNull()

    deriveSpy.mockRestore()
  })

  it('flags isDerivingKey while the key derivation is in flight and clears it once done', async () => {
    server.use(loginSuccessHandler)
    let resolveDerive!: (key: Uint8Array) => void
    const deriveSpy = jest
      .spyOn(cryptoAdapter, 'deriveEncryptionKey')
      .mockImplementation(() => new Promise((resolve) => { resolveDerive = resolve }))

    const { result: loginResult } = await renderHook(() => useLogin(), { wrapper })
    const { result: derivingResult } = await renderHook(() => useIsDerivingKey())

    loginResult.current.mutate({ phone: VALID_PHONE, password: VALID_PASSWORD })

    await waitFor(() => expect(derivingResult.current).toBe(true))

    resolveDerive(new Uint8Array(32))
    await waitFor(() => expect(derivingResult.current).toBe(false))

    deriveSpy.mockRestore()
  })

  it('surfaces an error and leaves the session and key cleared on invalid credentials', async () => {
    server.use(loginSuccessHandler)
    const { result } = await renderHook(() => useLogin(), { wrapper })

    result.current.mutate({ phone: VALID_PHONE, password: 'wrong-password' })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(getAccessToken()).toBeNull()
    expect(getEncryptionKey()).toBeNull()
    expect(setRefreshToken).not.toHaveBeenCalled()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })
})
