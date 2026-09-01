import { renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { createQueryClientWrapper } from '@/test/QueryClientWrapper'
import { server } from '@/test/msw/server'
import { useAdminUsers } from './useAdminUsers'

const USER = {
  id: 'u1',
  phone: '0900000001',
  fullName: 'Test User',
  role: 'member',
  status: 'active',
  createdAt: '2026-01-01T00:00:00Z',
}

describe('useAdminUsers', () => {
  it('returns a loading state initially', () => {
    server.use(
      http.get(`${API_BASE_URL}/admin/users`, () =>
        HttpResponse.json({ success: true, data: [USER], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } }),
      ),
    )

    const { result } = renderHook(() => useAdminUsers(), { wrapper: createQueryClientWrapper() })

    expect(result.current.isLoading).toBe(true)
  })

  it('returns data on success', async () => {
    server.use(
      http.get(`${API_BASE_URL}/admin/users`, () =>
        HttpResponse.json({ success: true, data: [USER], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } }),
      ),
    )

    const { result } = renderHook(() => useAdminUsers(), { wrapper: createQueryClientWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.data).toEqual([USER])
    expect(result.current.data?.meta.totalPages).toBe(1)
  })

  it('returns an error on failure', async () => {
    server.use(
      http.get(`${API_BASE_URL}/admin/users`, () =>
        HttpResponse.json({ success: false, error: { code: 'ADMIN_001', message: 'Forbidden', details: null } }, { status: 403 }),
      ),
    )

    const { result } = renderHook(() => useAdminUsers(), { wrapper: createQueryClientWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('refetches when params change', async () => {
    let requestCount = 0
    server.use(
      http.get(`${API_BASE_URL}/admin/users`, ({ request }) => {
        requestCount += 1
        const url = new URL(request.url)
        return HttpResponse.json({
          success: true,
          data: url.searchParams.get('search') ? [] : [USER],
          meta: { page: 1, limit: 20, total: 0, totalPages: 1 },
        })
      }),
    )

    const wrapper = createQueryClientWrapper()
    const { result, rerender } = renderHook(({ search }: { search?: string }) => useAdminUsers({ search }), {
      wrapper,
      initialProps: { search: undefined },
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.data).toEqual([USER])

    rerender({ search: 'nobody' })

    await waitFor(() => expect(result.current.data?.data).toEqual([]))
    expect(requestCount).toBe(2)
  })
})
