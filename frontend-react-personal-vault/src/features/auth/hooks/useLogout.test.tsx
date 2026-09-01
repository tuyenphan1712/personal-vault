import { renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { getAccessToken, setAccessToken } from '@/shared/lib/tokenStore'
import { getEncryptionKey, setEncryptionKey } from '@/shared/lib/keyStore'
import { server } from '@/test/msw/server'
import { withQueryClient } from '@/test/QueryClientWrapper'
import { createTestQueryClient } from '@/test/testQueryClient'
import { useAuthStore } from '../stores/auth.store'
import { useLogout } from './useLogout'

function seedSession() {
  setAccessToken('existing-access-token')
  setEncryptionKey('existing-key' as unknown as CryptoKey)
  useAuthStore.setState({
    user: { id: 'u1', phone: '0900000001', fullName: 'Test User', role: 'member' },
    isAuthenticated: true,
    isSessionLoading: false,
  })
}

describe('useLogout', () => {
  afterEach(() => {
    setAccessToken(null)
    setEncryptionKey(null)
    useAuthStore.setState({ user: null, isAuthenticated: false, isSessionLoading: false })
  })

  it('calls the logout service and clears the token, key, and session on success', async () => {
    let called = false
    server.use(
      http.post(`${API_BASE_URL}/auth/logout`, () => {
        called = true
        return HttpResponse.json({ success: true, data: null, meta: null })
      }),
    )
    seedSession()

    const { wrapper } = withQueryClient(createTestQueryClient())
    const { result } = renderHook(() => useLogout(), { wrapper })

    result.current.mutate()

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(called).toBe(true)
    expect(getAccessToken()).toBeNull()
    expect(getEncryptionKey()).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('still clears the local session even if the logout request fails', async () => {
    server.use(
      http.post(`${API_BASE_URL}/auth/logout`, () =>
        HttpResponse.json({ success: false, error: { code: 'AUTH_005', message: 'Missing or invalid access token', details: null } }, { status: 401 }),
      ),
    )
    seedSession()

    const { wrapper } = withQueryClient(createTestQueryClient())
    const { result } = renderHook(() => useLogout(), { wrapper })

    result.current.mutate()

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(getAccessToken()).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('clears the TanStack Query cache on settle', async () => {
    server.use(http.post(`${API_BASE_URL}/auth/logout`, () => HttpResponse.json({ success: true, data: null, meta: null })))
    seedSession()

    const { wrapper, queryClient } = withQueryClient(createTestQueryClient())
    const clearSpy = vi.spyOn(queryClient, 'clear')
    const { result } = renderHook(() => useLogout(), { wrapper })

    result.current.mutate()

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(clearSpy).toHaveBeenCalled()
  })
})
