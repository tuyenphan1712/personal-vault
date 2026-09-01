import { rest } from 'msw'
import { API_BASE_URL } from '@/src/config/constants'
import type { Credential } from '../../../types/credential.types'

const url = (path: string) => `${API_BASE_URL}${path}`

export const credentialFixture: Credential = {
  id: 'cred-1',
  platformName: 'Gmail',
  account: 'user@gmail.com',
  encryptedPassword: 'AAAAAAAAAAAAAAAA:ZmFrZS1jaXBoZXJ0ZXh0',
  ciphertextVersion: 1,
  note: 'Personal account',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

export const listCredentialsSuccessHandler = rest.get(url('/credentials'), (_req, res, ctx) =>
  res(
    ctx.status(200),
    ctx.json({
      success: true,
      data: [credentialFixture],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    }),
  ),
)

export const listCredentialsEmptyHandler = rest.get(url('/credentials'), (_req, res, ctx) =>
  res(
    ctx.status(200),
    ctx.json({ success: true, data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } }),
  ),
)

export const listCredentialsNetworkErrorHandler = rest.get(url('/credentials'), (_req, res) =>
  res.networkError('Failed to connect'),
)

export const getCredentialSuccessHandler = rest.get(url('/credentials/:id'), (req, res, ctx) =>
  res(ctx.status(200), ctx.json({ success: true, data: { ...credentialFixture, id: req.params.id }, meta: null })),
)

export const createCredentialSuccessHandler = rest.post(url('/credentials'), async (req, res, ctx) => {
  const body = await req.json()
  return res(
    ctx.status(201),
    ctx.json({ success: true, data: { ...credentialFixture, id: 'cred-new', ...body }, meta: null }),
  )
})

export const updateCredentialSuccessHandler = rest.patch(url('/credentials/:id'), async (req, res, ctx) => {
  const body = await req.json()
  return res(
    ctx.status(200),
    ctx.json({ success: true, data: { ...credentialFixture, id: req.params.id, ...body }, meta: null }),
  )
})

export const deleteCredentialSuccessHandler = rest.delete(url('/credentials/:id'), (_req, res, ctx) =>
  res(ctx.status(204)),
)
