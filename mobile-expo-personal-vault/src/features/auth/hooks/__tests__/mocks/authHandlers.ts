import { rest } from 'msw'
import { API_BASE_URL } from '@/src/config/constants'

export const VALID_PHONE = '0900000000'
export const VALID_PASSWORD = 'correct-password'
export const VALID_REFRESH_TOKEN = 'valid-refresh-token'

const url = (path: string) => `${API_BASE_URL}${path}`

export const currentUserFixture = {
  id: 'user-1',
  phone: VALID_PHONE,
  fullName: 'Nguyen Van A',
  role: 'member' as const,
}

export const loginSuccessHandler = rest.post(url('/auth/login'), async (req, res, ctx) => {
  const body = await req.json()
  if (body.phone === VALID_PHONE && body.password === VALID_PASSWORD) {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          user: currentUserFixture,
          accessToken: 'access-token-1',
          refreshToken: 'refresh-token-1',
          expiresIn: 900,
        },
        meta: null,
      }),
    )
  }
  return res(
    ctx.status(401),
    ctx.json({ success: false, error: { code: 'AUTH_001', message: 'Invalid phone or password', details: null } }),
  )
})

export const loginLockedOutHandler = rest.post(url('/auth/login'), (_req, res, ctx) =>
  res(
    ctx.status(429),
    ctx.json({
      success: false,
      error: { code: 'AUTH_004', message: 'Too many failed attempts', details: { retryAfterSeconds: 900 } },
    }),
  ),
)

export const registerSuccessHandler = rest.post(url('/auth/register'), (_req, res, ctx) =>
  res(ctx.status(201), ctx.json({ success: true, data: currentUserFixture, meta: null })),
)

export const registerDuplicatePhoneHandler = rest.post(url('/auth/register'), (_req, res, ctx) =>
  res(
    ctx.status(409),
    ctx.json({
      success: false,
      error: { code: 'USER_002', message: 'Phone number already registered', details: null },
    }),
  ),
)

export const logoutSuccessHandler = rest.post(url('/auth/logout'), (_req, res, ctx) => res(ctx.status(204)))

export const refreshSuccessHandler = rest.post(url('/auth/refresh'), async (req, res, ctx) => {
  const body = await req.json()
  if (body.refreshToken === VALID_REFRESH_TOKEN) {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: { accessToken: 'access-token-2', refreshToken: 'refresh-token-2', expiresIn: 900 },
        meta: null,
      }),
    )
  }
  return res(
    ctx.status(401),
    ctx.json({
      success: false,
      error: { code: 'AUTH_003', message: 'Refresh token is invalid or revoked', details: null },
    }),
  )
})

export const getMeSuccessHandler = rest.get(url('/auth/me'), (_req, res, ctx) =>
  res(ctx.status(200), ctx.json({ success: true, data: currentUserFixture, meta: null })),
)

export const getMeUnauthorizedHandler = rest.get(url('/auth/me'), (_req, res, ctx) =>
  res(
    ctx.status(401),
    ctx.json({
      success: false,
      error: { code: 'AUTH_005', message: 'Missing or invalid access token', details: null },
    }),
  ),
)
