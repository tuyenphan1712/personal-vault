import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react-native'
import type { ReactNode } from 'react'
import { server } from '@/src/shared/testing/msw/server'
import { createTestQueryClient } from '@/src/shared/testing/queryClient'
import { useAuditLogs } from '../useAuditLogs'
import { auditLogFixture, listAuditLogsNetworkErrorHandler, listAuditLogsSuccessHandler } from './mocks/auditLogHandlers'

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = createTestQueryClient()
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('useAuditLogs', () => {
  it('returns the entry list on success', async () => {
    server.use(listAuditLogsSuccessHandler)
    const { result } = await renderHook(() => useAuditLogs(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.data).toEqual([auditLogFixture])
  })

  it('returns an error on network failure', async () => {
    server.use(listAuditLogsNetworkErrorHandler)
    const { result } = await renderHook(() => useAuditLogs(), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
