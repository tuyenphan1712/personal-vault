import { renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { server } from '@/test/msw/server'
import { withQueryClient } from '@/test/QueryClientWrapper'
import { createTestQueryClient } from '@/test/testQueryClient'
import { documentKeys } from './documentKeys'
import { useDeleteDocument } from './useDeleteDocument'

describe('useDeleteDocument', () => {
  it('calls the service on mutate', async () => {
    let called = false
    server.use(
      http.delete(`${API_BASE_URL}/documents/:id`, () => {
        called = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const { wrapper } = withQueryClient(createTestQueryClient())
    const { result } = renderHook(() => useDeleteDocument(), { wrapper })

    result.current.mutate('d1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(called).toBe(true)
  })

  it('invalidates the documents query on success', async () => {
    server.use(http.delete(`${API_BASE_URL}/documents/:id`, () => new HttpResponse(null, { status: 204 })))

    const { wrapper, queryClient } = withQueryClient(createTestQueryClient())
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useDeleteDocument(), { wrapper })

    result.current.mutate('d1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: documentKeys.all })
  })

  it('surfaces an error on failure', async () => {
    server.use(
      http.delete(`${API_BASE_URL}/documents/:id`, () =>
        HttpResponse.json({ success: false, error: { code: 'DOCUMENT_001', message: 'Document not found', details: null } }, { status: 404 }),
      ),
    )

    const { wrapper } = withQueryClient(createTestQueryClient())
    const { result } = renderHook(() => useDeleteDocument(), { wrapper })

    result.current.mutate('missing')

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
