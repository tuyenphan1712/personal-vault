import { renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { createQueryClientWrapper } from '@/test/QueryClientWrapper'
import { server } from '@/test/msw/server'
import { useCredentials } from './useCredentials'

const CREDENTIAL = {
  id: 'c1',
  platformName: 'Gmail',
  account: 'user@example.com',
  encryptedPassword: 'ZmFrZS1pdg==:ZmFrZS1jaXBoZXJ0ZXh0',
  ciphertextVersion: 1,
  note: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

describe('useCredentials', () => {
  it('returns a loading state initially', () => {
    server.use(
      http.get(`${API_BASE_URL}/credentials`, () =>
        HttpResponse.json({ success: true, data: [CREDENTIAL], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } }),
      ),
    )

    const { result } = renderHook(() => useCredentials(), { wrapper: createQueryClientWrapper() })

    expect(result.current.isLoading).toBe(true)
  })

  it('returns data on success', async () => {
    server.use(
      http.get(`${API_BASE_URL}/credentials`, () =>
        HttpResponse.json({ success: true, data: [CREDENTIAL], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } }),
      ),
    )

    const { result } = renderHook(() => useCredentials(), { wrapper: createQueryClientWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.data).toEqual([CREDENTIAL])
    expect(result.current.data?.meta.totalPages).toBe(1)
  })

  it('returns an error on failure', async () => {
    server.use(
      http.get(`${API_BASE_URL}/credentials`, () =>
        HttpResponse.json({ success: false, error: { code: 'AUTH_005', message: 'Unauthorized', details: null } }, { status: 401 }),
      ),
    )

    const { result } = renderHook(() => useCredentials(), { wrapper: createQueryClientWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('refetches when params change', async () => {
    let requestCount = 0
    server.use(
      http.get(`${API_BASE_URL}/credentials`, ({ request }) => {
        requestCount += 1
        const url = new URL(request.url)
        return HttpResponse.json({
          success: true,
          data: url.searchParams.get('search') ? [] : [CREDENTIAL],
          meta: { page: 1, limit: 20, total: 0, totalPages: 1 },
        })
      }),
    )

    const wrapper = createQueryClientWrapper()
    const { result, rerender } = renderHook(({ search }: { search?: string }) => useCredentials({ search }), {
      wrapper,
      initialProps: { search: undefined },
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.data).toEqual([CREDENTIAL])

    rerender({ search: 'nobody' })

    await waitFor(() => expect(result.current.data?.data).toEqual([]))
    expect(requestCount).toBe(2)
  })
})
