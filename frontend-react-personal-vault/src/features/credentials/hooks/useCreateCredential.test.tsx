import { renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { server } from '@/test/msw/server'
import { withQueryClient } from '@/test/QueryClientWrapper'
import { createTestQueryClient } from '@/test/testQueryClient'
import { credentialKeys } from './credentialKeys'
import { useCreateCredential } from './useCreateCredential'

const PLAINTEXT_PASSWORD = 'super-secret-plaintext'

describe('useCreateCredential', () => {
  it('calls the service on mutate, sending ciphertext rather than the plaintext password', async () => {
    let capturedBody: unknown
    server.use(
      http.post(`${API_BASE_URL}/credentials`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({
          success: true,
          data: { id: 'c1', platformName: 'Gmail', account: 'user@example.com', encryptedPassword: 'aXY=:Y2lwaGVy', ciphertextVersion: 1, note: null, createdAt: 't', updatedAt: 't' },
          meta: null,
        })
      }),
    )

    const { wrapper } = withQueryClient(createTestQueryClient())
    const { result } = renderHook(() => useCreateCredential(), { wrapper })

    result.current.mutate({
      platformName: 'Gmail',
      account: 'user@example.com',
      encryptedPassword: 'aXY=:Y2lwaGVy', // pretend-encrypted, never the raw password
      note: null,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(capturedBody).not.toBe(PLAINTEXT_PASSWORD)
    expect(JSON.stringify(capturedBody)).not.toContain(PLAINTEXT_PASSWORD)
    expect((capturedBody as { encryptedPassword: string }).encryptedPassword).toBe('aXY=:Y2lwaGVy')
  })

  it('invalidates the credentials query on success', async () => {
    server.use(
      http.post(`${API_BASE_URL}/credentials`, () =>
        HttpResponse.json({
          success: true,
          data: { id: 'c1', platformName: 'Gmail', account: 'user@example.com', encryptedPassword: 'aXY=:Y2lwaGVy', ciphertextVersion: 1, note: null, createdAt: 't', updatedAt: 't' },
          meta: null,
        }),
      ),
    )

    const { wrapper, queryClient } = withQueryClient(createTestQueryClient())
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useCreateCredential(), { wrapper })

    result.current.mutate({ platformName: 'Gmail', account: 'user@example.com', encryptedPassword: 'aXY=:Y2lwaGVy' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: credentialKeys.all })
  })

  it('surfaces an error on failure', async () => {
    server.use(
      http.post(`${API_BASE_URL}/credentials`, () =>
        HttpResponse.json({ success: false, error: { code: 'COMMON_001', message: 'Validation failed', details: null } }, { status: 400 }),
      ),
    )

    const { wrapper } = withQueryClient(createTestQueryClient())
    const { result } = renderHook(() => useCreateCredential(), { wrapper })

    result.current.mutate({ platformName: '', account: '', encryptedPassword: '' })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
