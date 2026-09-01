import { renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { getAccessToken, setAccessToken } from '@/shared/lib/tokenStore'
import { server } from '@/test/msw/server'
import { useAuthStore } from '../stores/auth.store'
import { useSessionBootstrap } from './useSessionBootstrap'

describe('useSessionBootstrap', () => {
  afterEach(() => {
    setAccessToken(null)
    useAuthStore.setState({ user: null, isAuthenticated: false, isSessionLoading: true })
  })

  it('restores the session from a silent refresh + /auth/me on mount', async () => {
    server.use(
      http.post(`${API_BASE_URL}/auth/refresh`, () =>
        HttpResponse.json({ success: true, data: { accessToken: 'restored-token', refreshToken: null, expiresIn: 900 }, meta: null }),
      ),
      http.get(`${API_BASE_URL}/auth/me`, () =>
        HttpResponse.json({
          success: true,
          data: { id: 'u1', phone: '0900000001', fullName: 'Test User', role: 'member', status: 'active' },
          meta: null,
        }),
      ),
    )

    renderHook(() => useSessionBootstrap())

    await waitFor(() => expect(useAuthStore.getState().isSessionLoading).toBe(false))
    expect(getAccessToken()).toBe('restored-token')
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(useAuthStore.getState().user).toMatchObject({ id: 'u1', phone: '0900000001', fullName: 'Test User', role: 'member' })
  })

  it('clears the session and stops loading when the silent refresh fails (no session cookie)', async () => {
    server.use(
      http.post(`${API_BASE_URL}/auth/refresh`, () =>
        HttpResponse.json({ success: false, error: { code: 'AUTH_003', message: 'Refresh token is invalid or revoked', details: null } }, { status: 401 }),
      ),
    )

    renderHook(() => useSessionBootstrap())

    await waitFor(() => expect(useAuthStore.getState().isSessionLoading).toBe(false))
    expect(getAccessToken()).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })
})
