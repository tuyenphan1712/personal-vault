import { setupServer } from 'msw/node'

// Shared across all feature test suites; each suite registers its own handlers via server.use(...).
export const server = setupServer()
