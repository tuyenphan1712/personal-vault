import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react-native'
import type { ReactNode } from 'react'
import { server } from '@/src/shared/testing/msw/server'
import { createTestQueryClient } from '@/src/shared/testing/queryClient'
import { auditLogKeys } from '../auditLogKeys'
import { useMarkAllRead } from '../useMarkAllRead'
import { markAllReadSuccessHandler } from './mocks/auditLogHandlers'

let queryClient: QueryClient

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

beforeEach(() => {
  queryClient = createTestQueryClient()
})

describe('useMarkAllRead', () => {
  it('invalidates audit-log queries on success', async () => {
    server.use(markAllReadSuccessHandler)
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')
    const { result } = await renderHook(() => useMarkAllRead(), { wrapper })

    result.current.mutate()

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: auditLogKeys.all })
  })
})
