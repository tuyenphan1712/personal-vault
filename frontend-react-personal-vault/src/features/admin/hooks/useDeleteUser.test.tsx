import { renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { server } from '@/test/msw/server'
import { withQueryClient } from '@/test/QueryClientWrapper'
import { createTestQueryClient } from '@/test/testQueryClient'
import { adminKeys } from './adminKeys'
import { useDeleteUser } from './useDeleteUser'

describe('useDeleteUser', () => {
  it('calls the service on mutate', async () => {
    let called = false
    server.use(
      http.delete(`${API_BASE_URL}/admin/users/:id`, () => {
        called = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const { wrapper } = withQueryClient(createTestQueryClient())
    const { result } = renderHook(() => useDeleteUser(), { wrapper })

    result.current.mutate('u1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(called).toBe(true)
  })

  it('invalidates the admin-users query on success', async () => {
    server.use(http.delete(`${API_BASE_URL}/admin/users/:id`, () => new HttpResponse(null, { status: 204 })))

    const { wrapper, queryClient } = withQueryClient(createTestQueryClient())
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useDeleteUser(), { wrapper })

    result.current.mutate('u1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: adminKeys.all })
  })

  it('surfaces an error on failure', async () => {
    server.use(
      http.delete(`${API_BASE_URL}/admin/users/:id`, () =>
        HttpResponse.json({ success: false, error: { code: 'USER_001', message: 'User not found', details: null } }, { status: 404 }),
      ),
    )

    const { wrapper } = withQueryClient(createTestQueryClient())
    const { result } = renderHook(() => useDeleteUser(), { wrapper })

    result.current.mutate('missing')

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
