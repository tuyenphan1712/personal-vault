import { renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { createQueryClientWrapper } from '@/test/QueryClientWrapper'
import { server } from '@/test/msw/server'
import { useAuditLogs } from './useAuditLogs'

const ENTRY = {
  id: 'a1',
  action: 'CREDENTIAL_DELETED',
  targetLabel: 'Gmail',
  createdAt: '2026-01-01T00:00:00Z',
  readAt: null,
}

describe('useAuditLogs', () => {
  it('returns data on success', async () => {
    server.use(
      http.get(`${API_BASE_URL}/audit-logs`, () =>
        HttpResponse.json({ success: true, data: [ENTRY], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } }),
      ),
    )

    const { result } = renderHook(() => useAuditLogs(), { wrapper: createQueryClientWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.data).toEqual([ENTRY])
  })

  it('returns an error on failure', async () => {
    server.use(
      http.get(`${API_BASE_URL}/audit-logs`, () =>
        HttpResponse.json({ success: false, error: { code: 'AUTH_005', message: 'Unauthorized', details: null } }, { status: 401 }),
      ),
    )

    const { result } = renderHook(() => useAuditLogs(), { wrapper: createQueryClientWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
