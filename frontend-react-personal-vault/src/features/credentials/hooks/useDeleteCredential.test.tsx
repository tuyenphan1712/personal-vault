import { renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { server } from '@/test/msw/server'
import { withQueryClient } from '@/test/QueryClientWrapper'
import { createTestQueryClient } from '@/test/testQueryClient'
import { credentialKeys } from './credentialKeys'
import { useDeleteCredential } from './useDeleteCredential'

describe('useDeleteCredential', () => {
  it('calls the service on mutate', async () => {
    let called = false
    server.use(
      http.delete(`${API_BASE_URL}/credentials/:id`, () => {
        called = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const { wrapper } = withQueryClient(createTestQueryClient())
    const { result } = renderHook(() => useDeleteCredential(), { wrapper })

    result.current.mutate('c1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(called).toBe(true)
  })

  it('invalidates the credentials query on success', async () => {
    server.use(http.delete(`${API_BASE_URL}/credentials/:id`, () => new HttpResponse(null, { status: 204 })))

    const { wrapper, queryClient } = withQueryClient(createTestQueryClient())
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useDeleteCredential(), { wrapper })

    result.current.mutate('c1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: credentialKeys.all })
  })

  it('surfaces an error on failure', async () => {
    server.use(
      http.delete(`${API_BASE_URL}/credentials/:id`, () =>
        HttpResponse.json({ success: false, error: { code: 'CREDENTIAL_001', message: 'Credential not found', details: null } }, { status: 404 }),
      ),
    )

    const { wrapper } = withQueryClient(createTestQueryClient())
    const { result } = renderHook(() => useDeleteCredential(), { wrapper })

    result.current.mutate('missing')

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
