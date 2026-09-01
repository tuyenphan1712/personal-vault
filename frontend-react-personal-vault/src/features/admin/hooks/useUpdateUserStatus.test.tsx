import { renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { server } from '@/test/msw/server'
import { withQueryClient } from '@/test/QueryClientWrapper'
import { createTestQueryClient } from '@/test/testQueryClient'
import { adminKeys } from './adminKeys'
import { useUpdateUserStatus } from './useUpdateUserStatus'

describe('useUpdateUserStatus', () => {
  it('calls the service on mutate', async () => {
    let capturedBody: unknown
    server.use(
      http.patch(`${API_BASE_URL}/admin/users/:id/status`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ success: true, data: { id: 'u1', status: 'locked' }, meta: null })
      }),
    )

    const { wrapper } = withQueryClient(createTestQueryClient())
    const { result } = renderHook(() => useUpdateUserStatus(), { wrapper })

    result.current.mutate({ id: 'u1', payload: { status: 'locked' } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(capturedBody).toEqual({ status: 'locked' })
  })

  it('invalidates the admin-users query on success', async () => {
    server.use(
      http.patch(`${API_BASE_URL}/admin/users/:id/status`, () =>
        HttpResponse.json({ success: true, data: { id: 'u1', status: 'locked' }, meta: null }),
      ),
    )

    const { wrapper, queryClient } = withQueryClient(createTestQueryClient())
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useUpdateUserStatus(), { wrapper })

    result.current.mutate({ id: 'u1', payload: { status: 'locked' } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: adminKeys.all })
  })

  it('surfaces an error on failure', async () => {
    server.use(
      http.patch(`${API_BASE_URL}/admin/users/:id/status`, () =>
        HttpResponse.json({ success: false, error: { code: 'USER_001', message: 'User not found', details: null } }, { status: 404 }),
      ),
    )

    const { wrapper } = withQueryClient(createTestQueryClient())
    const { result } = renderHook(() => useUpdateUserStatus(), { wrapper })

    result.current.mutate({ id: 'missing', payload: { status: 'locked' } })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
