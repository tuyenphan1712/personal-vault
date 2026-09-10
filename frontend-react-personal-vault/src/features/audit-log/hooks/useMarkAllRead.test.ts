import { renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { withQueryClient } from '@/test/QueryClientWrapper'
import { createTestQueryClient } from '@/test/testQueryClient'
import { server } from '@/test/msw/server'
import { auditLogKeys } from './auditLogKeys'
import { useMarkAllRead } from './useMarkAllRead'

describe('useMarkAllRead', () => {
  it('invalidates audit-log queries on success', async () => {
    server.use(http.patch(`${API_BASE_URL}/audit-logs/read-all`, () => new HttpResponse(null, { status: 204 })))
    const { queryClient, wrapper } = withQueryClient(createTestQueryClient())
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useMarkAllRead(), { wrapper })

    result.current.mutate()

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: auditLogKeys.all }))
  })
})
