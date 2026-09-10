import { renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { createQueryClientWrapper } from '@/test/QueryClientWrapper'
import { server } from '@/test/msw/server'
import { useSessions } from './useSessions'

const SESSION = {
  id: 's1',
  clientType: 'web',
  deviceInfo: 'Mozilla/5.0',
  createdAt: '2026-01-01T00:00:00Z',
  expiresAt: '2026-02-01T00:00:00Z',
  isCurrent: true,
}

describe('useSessions', () => {
  it('returns data on success', async () => {
    server.use(http.get(`${API_BASE_URL}/sessions`, () => HttpResponse.json({ success: true, data: [SESSION], meta: null })))

    const { result } = renderHook(() => useSessions(), { wrapper: createQueryClientWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([SESSION])
  })

  it('returns an error on failure', async () => {
    server.use(
      http.get(`${API_BASE_URL}/sessions`, () =>
        HttpResponse.json({ success: false, error: { code: 'AUTH_005', message: 'Unauthorized', details: null } }, { status: 401 }),
      ),
    )

    const { result } = renderHook(() => useSessions(), { wrapper: createQueryClientWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
