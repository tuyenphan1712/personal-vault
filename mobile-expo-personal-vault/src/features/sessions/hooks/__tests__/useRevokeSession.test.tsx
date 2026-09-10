import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react-native'
import type { ReactNode } from 'react'
import { server } from '@/src/shared/testing/msw/server'
import { createTestQueryClient } from '@/src/shared/testing/queryClient'
import { sessionKeys } from '../sessionKeys'
import { useRevokeSession } from '../useRevokeSession'
import { revokeSessionSuccessHandler } from './mocks/sessionHandlers'

let queryClient: QueryClient

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

beforeEach(() => {
  queryClient = createTestQueryClient()
})

describe('useRevokeSession', () => {
  it('invalidates the sessions query on success', async () => {
    server.use(revokeSessionSuccessHandler)
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')
    const { result } = await renderHook(() => useRevokeSession(), { wrapper })

    result.current.mutate('sess-1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: sessionKeys.all })
  })
})
