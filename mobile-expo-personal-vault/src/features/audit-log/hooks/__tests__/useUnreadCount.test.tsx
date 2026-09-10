import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react-native'
import type { ReactNode } from 'react'
import { server } from '@/src/shared/testing/msw/server'
import { createTestQueryClient } from '@/src/shared/testing/queryClient'
import { useUnreadCount } from '../useUnreadCount'
import { unreadCountSuccessHandler } from './mocks/auditLogHandlers'

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = createTestQueryClient()
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('useUnreadCount', () => {
  it('returns the unread count on success', async () => {
    server.use(unreadCountSuccessHandler(4))
    const { result } = await renderHook(() => useUnreadCount(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.count).toBe(4)
  })
})
