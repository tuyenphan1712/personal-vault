import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { server } from '@/test/msw/server'
import { authService } from './auth.service'

const AUTH_USER = {
  id: 'u1',
  phone: '0900000001',
  fullName: 'Test User',
  role: 'member' as const,
  status: 'active' as const,
}

describe('authService', () => {
  it('register POSTs /auth/register with the payload and unwraps the envelope', async () => {
    let capturedBody: unknown
    server.use(
      http.post(`${API_BASE_URL}/auth/register`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ success: true, data: AUTH_USER, meta: null })
      }),
    )

    const payload = { phone: '0900000001', password: 'not-a-real-password', fullName: 'Test User' }
    const result = await authService.register(payload)

    expect(capturedBody).toEqual(payload)
    expect(result).toEqual(AUTH_USER)
  })

  it('login POSTs /auth/login with the payload and unwraps the envelope', async () => {
    let capturedBody: unknown
    server.use(
      http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({
          success: true,
          data: {
            user: { id: 'u1', phone: '0900000001', fullName: 'Test User', role: 'member' },
            accessToken: 'fake-access-token',
            refreshToken: null,
            expiresIn: 900,
          },
          meta: null,
        })
      }),
    )

    const payload = { phone: '0900000001', password: 'not-a-real-password' }
    const result = await authService.login(payload)

    expect(capturedBody).toEqual(payload)
    expect(result.accessToken).toBe('fake-access-token')
    expect(result.user).toEqual({ id: 'u1', phone: '0900000001', fullName: 'Test User', role: 'member' })
  })

  it('refresh POSTs /auth/refresh with no body and unwraps the envelope', async () => {
    let bodyText = ''
    server.use(
      http.post(`${API_BASE_URL}/auth/refresh`, async ({ request }) => {
        bodyText = await request.text()
        return HttpResponse.json({
          success: true,
          data: { accessToken: 'new-access-token', refreshToken: null, expiresIn: 900 },
          meta: null,
        })
      }),
    )

    const result = await authService.refresh()

    expect(bodyText).toBe('')
    expect(result).toEqual({ accessToken: 'new-access-token', refreshToken: null, expiresIn: 900 })
  })

  it('logout POSTs /auth/logout', async () => {
    let called = false
    server.use(
      http.post(`${API_BASE_URL}/auth/logout`, () => {
        called = true
        return HttpResponse.json({ success: true, data: null, meta: null })
      }),
    )

    await authService.logout()

    expect(called).toBe(true)
  })

  it('me GETs /auth/me and unwraps the envelope', async () => {
    server.use(http.get(`${API_BASE_URL}/auth/me`, () => HttpResponse.json({ success: true, data: AUTH_USER, meta: null })))

    const result = await authService.me()

    expect(result).toEqual(AUTH_USER)
  })
})
