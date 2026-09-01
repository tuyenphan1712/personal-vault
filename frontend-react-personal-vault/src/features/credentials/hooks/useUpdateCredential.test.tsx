import { renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { server } from '@/test/msw/server'
import { withQueryClient } from '@/test/QueryClientWrapper'
import { createTestQueryClient } from '@/test/testQueryClient'
import { credentialKeys } from './credentialKeys'
import { useUpdateCredential } from './useUpdateCredential'

describe('useUpdateCredential', () => {
  it('calls the service on mutate with ciphertext, never the plaintext password', async () => {
    let capturedBody: unknown
    server.use(
      http.patch(`${API_BASE_URL}/credentials/:id`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({
          success: true,
          data: { id: 'c1', platformName: 'Gmail', account: 'user@example.com', encryptedPassword: 'aXY=:bmV3Y2lwaGVy', ciphertextVersion: 1, note: null, createdAt: 't', updatedAt: 't' },
          meta: null,
        })
      }),
    )

    const { wrapper } = withQueryClient(createTestQueryClient())
    const { result } = renderHook(() => useUpdateCredential(), { wrapper })

    result.current.mutate({ id: 'c1', payload: { encryptedPassword: 'aXY=:bmV3Y2lwaGVy' } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(capturedBody).toEqual({ encryptedPassword: 'aXY=:bmV3Y2lwaGVy' })
    expect(JSON.stringify(capturedBody)).not.toContain('plaintext')
  })

  it('invalidates the credentials query on success', async () => {
    server.use(
      http.patch(`${API_BASE_URL}/credentials/:id`, () =>
        HttpResponse.json({
          success: true,
          data: { id: 'c1', platformName: 'Gmail', account: 'user@example.com', encryptedPassword: 'aXY=:Y2lwaGVy', ciphertextVersion: 1, note: null, createdAt: 't', updatedAt: 't' },
          meta: null,
        }),
      ),
    )

    const { wrapper, queryClient } = withQueryClient(createTestQueryClient())
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useUpdateCredential(), { wrapper })

    result.current.mutate({ id: 'c1', payload: { note: 'Updated' } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: credentialKeys.all })
  })

  it('surfaces an error on failure', async () => {
    server.use(
      http.patch(`${API_BASE_URL}/credentials/:id`, () =>
        HttpResponse.json({ success: false, error: { code: 'CREDENTIAL_001', message: 'Credential not found', details: null } }, { status: 404 }),
      ),
    )

    const { wrapper } = withQueryClient(createTestQueryClient())
    const { result } = renderHook(() => useUpdateCredential(), { wrapper })

    result.current.mutate({ id: 'missing', payload: { note: 'x' } })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
