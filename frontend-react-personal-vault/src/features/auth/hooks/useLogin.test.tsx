import { renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { getAccessToken, setAccessToken } from '@/shared/lib/tokenStore'
import { getEncryptionKey, setEncryptionKey } from '@/shared/lib/keyStore'
import { server } from '@/test/msw/server'
import { createQueryClientWrapper } from '@/test/QueryClientWrapper'
import { useAuthStore } from '../stores/auth.store'
import { useLogin } from './useLogin'

// PBKDF2 key derivation is exercised in shared/lib/crypto's own tests — here it's mocked
// so the hook test only asserts the wiring (service call -> token/key/session side effects).
vi.mock('@/shared/lib/crypto', () => ({
  deriveEncryptionKey: vi.fn().mockResolvedValue('fake-derived-key'),
}))

describe('useLogin', () => {
  afterEach(() => {
    setAccessToken(null)
    setEncryptionKey(null)
    useAuthStore.setState({ user: null, isAuthenticated: false, isSessionLoading: false })
  })

  it('logs in, stores the access token/encryption key, and sets the session on success', async () => {
    server.use(
      http.post(`${API_BASE_URL}/auth/login`, () =>
        HttpResponse.json({
          success: true,
          data: {
            user: { id: 'u1', phone: '0900000001', fullName: 'Test User', role: 'member' },
            accessToken: 'fake-access-token',
            refreshToken: null,
            expiresIn: 900,
          },
          meta: null,
        }),
      ),
    )

    const wrapper = createQueryClientWrapper()
    const { result } = renderHook(() => useLogin(), { wrapper })

    result.current.mutate({ phone: '0900000001', password: 'not-a-real-password' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getAccessToken()).toBe('fake-access-token')
    expect(getEncryptionKey()).toBe('fake-derived-key')
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(useAuthStore.getState().user).toEqual({ id: 'u1', phone: '0900000001', fullName: 'Test User', role: 'member' })
  })

  it('surfaces an error and leaves the session untouched on invalid credentials', async () => {
    server.use(
      http.post(`${API_BASE_URL}/auth/login`, () =>
        HttpResponse.json(
          { success: false, error: { code: 'AUTH_001', message: 'Invalid phone or password', details: null } },
          { status: 401 },
        ),
      ),
    )

    const wrapper = createQueryClientWrapper()
    const { result } = renderHook(() => useLogin(), { wrapper })

    result.current.mutate({ phone: '0900000001', password: 'wrong-password' })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(getAccessToken()).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })
})
