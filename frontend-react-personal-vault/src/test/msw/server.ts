import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { API_BASE_URL } from '@/config/constants'

/**
 * Default handlers for requests fired by components rendered on nearly every page
 * (e.g. `TopBar`'s `NotificationBell`) that most page/feature tests don't care about
 * and shouldn't have to mock individually. `server.resetHandlers()` (called in
 * `afterEach`) restores these after a test overrides them with `server.use(...)`.
 */
const defaultHandlers = [
  http.get(`${API_BASE_URL}/audit-logs/unread-count`, () =>
    HttpResponse.json({ success: true, data: { count: 0 }, meta: null }),
  ),
  http.get(`${API_BASE_URL}/audit-logs`, () =>
    HttpResponse.json({ success: true, data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } }),
  ),
]

/** Shared MSW server for tests. Each test file registers its own handlers with `server.use(...)`. */
export const server = setupServer(...defaultHandlers)
