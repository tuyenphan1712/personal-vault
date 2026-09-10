import { rest } from 'msw'
import { API_BASE_URL } from '@/src/config/constants'
import type { Session } from '../../../types/session.types'

const url = (path: string) => `${API_BASE_URL}${path}`

export const sessionFixture: Session = {
  id: 'sess-1',
  clientType: 'web',
  deviceInfo: 'Chrome on Windows',
  createdAt: '2026-01-01T00:00:00Z',
  expiresAt: '2026-02-01T00:00:00Z',
  isCurrent: false,
}

export const listSessionsSuccessHandler = rest.get(url('/sessions'), (_req, res, ctx) =>
  res(ctx.status(200), ctx.json({ success: true, data: [sessionFixture], meta: null })),
)

export const listSessionsEmptyHandler = rest.get(url('/sessions'), (_req, res, ctx) =>
  res(ctx.status(200), ctx.json({ success: true, data: [], meta: null })),
)

export const listSessionsNetworkErrorHandler = rest.get(url('/sessions'), (_req, res) => res.networkError('Failed to connect'))

export const revokeSessionSuccessHandler = rest.delete(url('/sessions/:id'), (_req, res, ctx) => res(ctx.status(204)))
