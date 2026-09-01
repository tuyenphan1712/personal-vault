import { setupServer } from 'msw/node'

/** Shared MSW server for tests. Each test file registers its own handlers with `server.use(...)`. */
export const server = setupServer()
