import { renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { createQueryClientWrapper } from '@/test/QueryClientWrapper'
import { server } from '@/test/msw/server'
import { useUnreadCount } from './useUnreadCount'

describe('useUnreadCount', () => {
  it('returns the unread count on success', async () => {
    server.use(
      http.get(`${API_BASE_URL}/audit-logs/unread-count`, () =>
        HttpResponse.json({ success: true, data: { count: 3 }, meta: null }),
      ),
    )

    const { result } = renderHook(() => useUnreadCount(), { wrapper: createQueryClientWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.count).toBe(3)
  })
})
