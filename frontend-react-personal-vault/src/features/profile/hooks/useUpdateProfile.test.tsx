import { renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { useAuthStore } from '@/features/auth'
import { withQueryClient } from '@/test/QueryClientWrapper'
import { server } from '@/test/msw/server'
import { createTestQueryClient } from '@/test/testQueryClient'
import { profileKeys } from './profileKeys'
import { useUpdateProfile } from './useUpdateProfile'

const UPDATED_PROFILE = {
  id: 'u1',
  phone: '0900000001',
  fullName: 'John Doe',
  role: 'member' as const,
  status: 'active' as const,
  birthday: '1990-01-01',
}

describe('useUpdateProfile', () => {
  afterEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false, isSessionLoading: false })
  })

  it('calls the service with the given payload', async () => {
    let capturedBody: unknown
    server.use(
      http.patch(`${API_BASE_URL}/profile`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ success: true, data: UPDATED_PROFILE, meta: null })
      }),
    )

    const { wrapper } = withQueryClient(createTestQueryClient())
    const { result } = renderHook(() => useUpdateProfile(), { wrapper })

    result.current.mutate({ fullName: 'John Doe', birthday: '1990-01-01' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(capturedBody).toEqual({ fullName: 'John Doe', birthday: '1990-01-01' })
  })

  it('invalidates the profile query on success', async () => {
    server.use(http.patch(`${API_BASE_URL}/profile`, () => HttpResponse.json({ success: true, data: UPDATED_PROFILE, meta: null })))

    const { wrapper, queryClient } = withQueryClient(createTestQueryClient())
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useUpdateProfile(), { wrapper })

    result.current.mutate({ fullName: 'John Doe', birthday: '1990-01-01' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: profileKeys.all })
  })

  it('updates the session fullName when a user is signed in', async () => {
    useAuthStore.setState({
      user: { id: 'u1', phone: '0900000001', fullName: 'Jane Doe', role: 'member' },
      isAuthenticated: true,
      isSessionLoading: false,
    })
    server.use(http.patch(`${API_BASE_URL}/profile`, () => HttpResponse.json({ success: true, data: UPDATED_PROFILE, meta: null })))

    const { wrapper } = withQueryClient(createTestQueryClient())
    const { result } = renderHook(() => useUpdateProfile(), { wrapper })

    result.current.mutate({ fullName: 'John Doe', birthday: '1990-01-01' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(useAuthStore.getState().user?.fullName).toBe('John Doe')
  })

  it('surfaces an error on failure', async () => {
    server.use(
      http.patch(`${API_BASE_URL}/profile`, () =>
        HttpResponse.json({ success: false, error: { code: 'COMMON_001', message: 'Validation failed', details: null } }, { status: 400 }),
      ),
    )

    const { wrapper } = withQueryClient(createTestQueryClient())
    const { result } = renderHook(() => useUpdateProfile(), { wrapper })

    result.current.mutate({ fullName: '', birthday: null })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
