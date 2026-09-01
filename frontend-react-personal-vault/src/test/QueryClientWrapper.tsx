import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { createTestQueryClient } from './testQueryClient'

/** Wraps children in a fresh QueryClientProvider — pass to `renderHook`'s or `render`'s `wrapper` option. */
export function createQueryClientWrapper() {
  return withQueryClient(createTestQueryClient()).wrapper
}

/** Same as `createQueryClientWrapper`, but also returns the `QueryClient` instance so a test can spy on it. */
export function withQueryClient(queryClient: QueryClient) {
  return {
    queryClient,
    wrapper: function QueryClientWrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    },
  }
}
