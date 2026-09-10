import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react-native'
import type { ReactNode } from 'react'
import { server } from '@/src/shared/testing/msw/server'
import { createTestQueryClient } from '@/src/shared/testing/queryClient'
import { useSessions } from '../useSessions'
import { listSessionsNetworkErrorHandler, listSessionsSuccessHandler, sessionFixture } from './mocks/sessionHandlers'

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = createTestQueryClient()
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('useSessions', () => {
  it('returns the session list on success', async () => {
    server.use(listSessionsSuccessHandler)
    const { result } = await renderHook(() => useSessions(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([sessionFixture])
  })

  it('returns an error on network failure', async () => {
    server.use(listSessionsNetworkErrorHandler)
    const { result } = await renderHook(() => useSessions(), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
