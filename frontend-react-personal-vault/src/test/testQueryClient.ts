import { QueryClient } from '@tanstack/react-query'

/** Fresh QueryClient per test — retries disabled so failing requests resolve immediately. */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}
