import { rest } from 'msw'
import { API_BASE_URL } from '@/src/config/constants'
import { server } from '@/src/shared/testing/msw/server'
import { setAccessToken } from '../../auth/tokenStore'
import { apiClient, registerAuthHandlers } from '../axios'

const url = (path: string) => `${API_BASE_URL}${path}`

beforeEach(() => {
  setAccessToken('expired-access-token')
})

describe('apiClient auth interceptor', () => {
  it('coordinates concurrent 401s onto a single refresh call, then retries each request once', async () => {
    let protectedCallCount = 0
    let refreshCallCount = 0

    server.use(
      rest.get(url('/protected'), (req, res, ctx) => {
        protectedCallCount += 1
        const authHeader = req.headers.get('Authorization')
        if (authHeader === 'Bearer new-access-token') {
          return res(ctx.status(200), ctx.json({ success: true, data: 'ok', meta: null }))
        }
        return res(
          ctx.status(401),
          ctx.json({ success: false, error: { code: 'AUTH_005', message: 'Missing or invalid access token', details: null } }),
        )
      }),
      rest.post(url('/auth/refresh'), (_req, res, ctx) => {
        refreshCallCount += 1
        return res(ctx.status(200), ctx.json({ success: true, data: { accessToken: 'new-access-token' }, meta: null }))
      }),
    )

    const refreshAccessToken = jest.fn(async () => {
      const res = await apiClient.post<{ data: { accessToken: string } }>('/auth/refresh', {})
      const token = res.data.data.accessToken
      setAccessToken(token)
      return token
    })
    const handleSessionExpired = jest.fn()
    registerAuthHandlers({ refreshAccessToken, handleSessionExpired })

    const [first, second] = await Promise.all([apiClient.get(url('/protected')), apiClient.get(url('/protected'))])

    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    expect(refreshCallCount).toBe(1)
    expect(protectedCallCount).toBe(4)
    expect(handleSessionExpired).not.toHaveBeenCalled()
  })

  it('clears the session and rejects instead of retrying when the refresh handler cannot get a new token', async () => {
    server.use(
      rest.get(url('/protected'), (_req, res, ctx) =>
        res(
          ctx.status(401),
          ctx.json({ success: false, error: { code: 'AUTH_005', message: 'Missing or invalid access token', details: null } }),
        ),
      ),
    )

    const refreshAccessToken = jest.fn(async () => null)
    const handleSessionExpired = jest.fn()
    registerAuthHandlers({ refreshAccessToken, handleSessionExpired })

    await expect(apiClient.get(url('/protected'))).rejects.toMatchObject({
      response: { status: 401 },
    })
    expect(handleSessionExpired).toHaveBeenCalledTimes(1)
  })

  it('does not attempt a coordinated refresh for a 401 from the refresh endpoint itself', async () => {
    let refreshCallCount = 0
    server.use(
      rest.post(url('/auth/refresh'), (_req, res, ctx) => {
        refreshCallCount += 1
        return res(
          ctx.status(401),
          ctx.json({ success: false, error: { code: 'AUTH_003', message: 'Refresh token is invalid or revoked', details: null } }),
        )
      }),
    )

    const refreshAccessToken = jest.fn(async () => 'should-not-be-called')
    const handleSessionExpired = jest.fn()
    registerAuthHandlers({ refreshAccessToken, handleSessionExpired })

    await expect(apiClient.post(url('/auth/refresh'), {})).rejects.toMatchObject({ response: { status: 401 } })

    expect(refreshCallCount).toBe(1)
    expect(refreshAccessToken).not.toHaveBeenCalled()
    expect(handleSessionExpired).not.toHaveBeenCalled()
  })
})
