import { rest } from 'msw'
import { API_BASE_URL } from '@/src/config/constants'
import type { AuditLogEntry } from '../../../types/auditLog.types'

const url = (path: string) => `${API_BASE_URL}${path}`

export const auditLogFixture: AuditLogEntry = {
  id: 'a1',
  action: 'CREDENTIAL_DELETED',
  targetLabel: 'Gmail',
  createdAt: '2026-01-01T00:00:00Z',
  readAt: null,
}

export const listAuditLogsSuccessHandler = rest.get(url('/audit-logs'), (_req, res, ctx) =>
  res(
    ctx.status(200),
    ctx.json({ success: true, data: [auditLogFixture], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } }),
  ),
)

export const listAuditLogsNetworkErrorHandler = rest.get(url('/audit-logs'), (_req, res) =>
  res.networkError('Failed to connect'),
)

export const unreadCountSuccessHandler = (count: number) =>
  rest.get(url('/audit-logs/unread-count'), (_req, res, ctx) =>
    res(ctx.status(200), ctx.json({ success: true, data: { count }, meta: null })),
  )

export const markAllReadSuccessHandler = rest.patch(url('/audit-logs/read-all'), (_req, res, ctx) => res(ctx.status(204)))
