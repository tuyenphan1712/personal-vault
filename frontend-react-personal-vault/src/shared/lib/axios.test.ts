import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { server } from '@/test/msw/server'
import { apiClient, registerAuthHandlers } from './axios'
import { setAccessToken } from './tokenStore'

describe('apiClient 401 interceptor', () => {
  afterEach(() => {
    setAccessToken(null)
  })

  it('does not attempt a token refresh for a 401 from /auth/change-password', async () => {
    const refreshAccessToken = vi.fn().mockResolvedValue('new-access-token')
    const handleSessionExpired = vi.fn()
    registerAuthHandlers({ refreshAccessToken, handleSessionExpired })
    setAccessToken('stale-access-token')

    server.use(
      http.post(`${API_BASE_URL}/auth/change-password`, () =>
        HttpResponse.json(
          { success: false, error: { code: 'AUTH_006', message: 'Current password is incorrect', details: null } },
          { status: 401 },
        ),
      ),
    )

    await expect(apiClient.post('/auth/change-password', {})).rejects.toMatchObject({
      response: { status: 401 },
    })

    expect(refreshAccessToken).not.toHaveBeenCalled()
    expect(handleSessionExpired).not.toHaveBeenCalled()
  })

  it('still attempts a token refresh for a 401 from an unrelated protected endpoint', async () => {
    const refreshAccessToken = vi.fn().mockResolvedValue(null)
    const handleSessionExpired = vi.fn()
    registerAuthHandlers({ refreshAccessToken, handleSessionExpired })
    setAccessToken('stale-access-token')

    server.use(
      http.get(`${API_BASE_URL}/credentials`, () =>
        HttpResponse.json(
          { success: false, error: { code: 'AUTH_005', message: 'Missing or invalid access token', details: null } },
          { status: 401 },
        ),
      ),
    )

    await expect(apiClient.get('/credentials')).rejects.toMatchObject({ response: { status: 401 } })

    expect(refreshAccessToken).toHaveBeenCalledTimes(1)
    expect(handleSessionExpired).toHaveBeenCalledTimes(1)
  })
})
