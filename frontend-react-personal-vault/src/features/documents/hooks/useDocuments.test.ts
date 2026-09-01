import { renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { createQueryClientWrapper } from '@/test/QueryClientWrapper'
import { server } from '@/test/msw/server'
import { useDocuments } from './useDocuments'

const DOCUMENT = {
  id: 'd1',
  title: 'Passport front page',
  docType: 'identity_civil_status',
  mimeType: 'image/png',
  fileSize: 482113,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

describe('useDocuments', () => {
  it('returns a loading state initially', () => {
    server.use(
      http.get(`${API_BASE_URL}/documents`, () =>
        HttpResponse.json({ success: true, data: [DOCUMENT], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } }),
      ),
    )

    const { result } = renderHook(() => useDocuments(), { wrapper: createQueryClientWrapper() })

    expect(result.current.isLoading).toBe(true)
  })

  it('returns data on success', async () => {
    server.use(
      http.get(`${API_BASE_URL}/documents`, () =>
        HttpResponse.json({ success: true, data: [DOCUMENT], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } }),
      ),
    )

    const { result } = renderHook(() => useDocuments(), { wrapper: createQueryClientWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.data).toEqual([DOCUMENT])
    expect(result.current.data?.meta?.totalPages).toBe(1)
  })

  it('returns an error on failure', async () => {
    server.use(
      http.get(`${API_BASE_URL}/documents`, () =>
        HttpResponse.json({ success: false, error: { code: 'AUTH_005', message: 'Unauthorized', details: null } }, { status: 401 }),
      ),
    )

    const { result } = renderHook(() => useDocuments(), { wrapper: createQueryClientWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('refetches when params change', async () => {
    let requestCount = 0
    server.use(
      http.get(`${API_BASE_URL}/documents`, ({ request }) => {
        requestCount += 1
        const url = new URL(request.url)
        return HttpResponse.json({
          success: true,
          data: url.searchParams.get('search') ? [] : [DOCUMENT],
          meta: { page: 1, limit: 20, total: 0, totalPages: 1 },
        })
      }),
    )

    const wrapper = createQueryClientWrapper()
    const { result, rerender } = renderHook(({ search }: { search?: string }) => useDocuments({ search }), {
      wrapper,
      initialProps: { search: undefined },
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.data).toEqual([DOCUMENT])

    rerender({ search: 'nobody' })

    await waitFor(() => expect(result.current.data?.data).toEqual([]))
    expect(requestCount).toBe(2)
  })
})
