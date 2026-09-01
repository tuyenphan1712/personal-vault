import { renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { server } from '@/test/msw/server'
import { createQueryClientWrapper } from '@/test/QueryClientWrapper'
import { useRegister } from './useRegister'

describe('useRegister', () => {
  it('calls the register service and returns the created user on success', async () => {
    let capturedBody: unknown
    server.use(
      http.post(`${API_BASE_URL}/auth/register`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({
          success: true,
          data: { id: 'u1', phone: '0900000001', fullName: 'Test User', role: 'member', status: 'active' },
          meta: null,
        })
      }),
    )

    const wrapper = createQueryClientWrapper()
    const { result } = renderHook(() => useRegister(), { wrapper })

    result.current.mutate({ phone: '0900000001', password: 'not-a-real-password', fullName: 'Test User' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(capturedBody).toEqual({ phone: '0900000001', password: 'not-a-real-password', fullName: 'Test User' })
    expect(result.current.data).toEqual({ id: 'u1', phone: '0900000001', fullName: 'Test User', role: 'member', status: 'active' })
  })

  it('surfaces an error when the phone number is already registered', async () => {
    server.use(
      http.post(`${API_BASE_URL}/auth/register`, () =>
        HttpResponse.json(
          { success: false, error: { code: 'USER_002', message: 'Phone number already registered', details: null } },
          { status: 409 },
        ),
      ),
    )

    const wrapper = createQueryClientWrapper()
    const { result } = renderHook(() => useRegister(), { wrapper })

    result.current.mutate({ phone: '0900000001', password: 'not-a-real-password', fullName: 'Test User' })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
