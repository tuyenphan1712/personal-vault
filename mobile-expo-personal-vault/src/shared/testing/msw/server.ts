import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { API_BASE_URL } from '@/src/config/constants'

const url = (path: string) => `${API_BASE_URL}${path}`

/**
 * Default handlers for requests fired by components rendered on nearly every screen
 * (Home's notification bell) that most feature/screen tests don't care about and
 * shouldn't have to mock individually. `server.resetHandlers()` (called in
 * `afterEach`) restores these after a test overrides them with `server.use(...)`.
 */
const defaultHandlers = [
  rest.get(url('/audit-logs/unread-count'), (_req, res, ctx) =>
    res(ctx.status(200), ctx.json({ success: true, data: { count: 0 }, meta: null })),
  ),
  rest.get(url('/audit-logs'), (_req, res, ctx) =>
    res(ctx.status(200), ctx.json({ success: true, data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } })),
  ),
]

// Shared across all feature test suites; each suite registers its own handlers via server.use(...).
export const server = setupServer(...defaultHandlers)
