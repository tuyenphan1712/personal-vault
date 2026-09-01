import { renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { createQueryClientWrapper } from '@/test/QueryClientWrapper'
import { server } from '@/test/msw/server'
import { useProfile } from './useProfile'

const PROFILE = {
  id: 'u1',
  phone: '0900000001',
  fullName: 'Jane Doe',
  role: 'member',
  status: 'active',
  birthday: '1990-01-01',
}

describe('useProfile', () => {
  it('returns a loading state initially', () => {
    server.use(http.get(`${API_BASE_URL}/profile`, () => HttpResponse.json({ success: true, data: PROFILE, meta: null })))

    const { result } = renderHook(() => useProfile(), { wrapper: createQueryClientWrapper() })

    expect(result.current.isLoading).toBe(true)
  })

  it('returns the profile on success', async () => {
    server.use(http.get(`${API_BASE_URL}/profile`, () => HttpResponse.json({ success: true, data: PROFILE, meta: null })))

    const { result } = renderHook(() => useProfile(), { wrapper: createQueryClientWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(PROFILE)
  })

  it('returns an error on failure', async () => {
    server.use(
      http.get(`${API_BASE_URL}/profile`, () =>
        HttpResponse.json({ success: false, error: { code: 'AUTH_005', message: 'Unauthorized', details: null } }, { status: 401 }),
      ),
    )

    const { result } = renderHook(() => useProfile(), { wrapper: createQueryClientWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
