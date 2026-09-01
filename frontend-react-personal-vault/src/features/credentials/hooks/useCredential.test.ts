import { renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { createQueryClientWrapper } from '@/test/QueryClientWrapper'
import { server } from '@/test/msw/server'
import { useCredential } from './useCredential'

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

describe('useCredential', () => {
  it('returns a loading state initially', () => {
    server.use(http.get(`${API_BASE_URL}/credentials/:id`, () => HttpResponse.json({ success: true, data: CREDENTIAL, meta: null })))

    const { result } = renderHook(() => useCredential('c1'), { wrapper: createQueryClientWrapper() })

    expect(result.current.isLoading).toBe(true)
  })

  it('returns data on success', async () => {
    server.use(http.get(`${API_BASE_URL}/credentials/:id`, () => HttpResponse.json({ success: true, data: CREDENTIAL, meta: null })))

    const { result } = renderHook(() => useCredential('c1'), { wrapper: createQueryClientWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(CREDENTIAL)
  })

  it('returns an error on failure (e.g. not found or not owned)', async () => {
    server.use(
      http.get(`${API_BASE_URL}/credentials/:id`, () =>
        HttpResponse.json({ success: false, error: { code: 'CREDENTIAL_001', message: 'Credential not found', details: null } }, { status: 404 }),
      ),
    )

    const { result } = renderHook(() => useCredential('missing'), { wrapper: createQueryClientWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
