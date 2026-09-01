import { QueryClient } from '@tanstack/react-query'

// A fresh, retry-free QueryClient per test so failures surface immediately instead of after retry delays.
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}
