import { renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { createQueryClientWrapper } from '@/test/QueryClientWrapper'
import { server } from '@/test/msw/server'
import { useDocument } from './useDocument'

const DOCUMENT = {
  id: 'd1',
  title: 'Passport front page',
  docType: 'identity_civil_status',
  mimeType: 'image/png',
  fileSize: 482113,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

describe('useDocument', () => {
  it('returns a loading state initially', () => {
    server.use(http.get(`${API_BASE_URL}/documents/:id`, () => HttpResponse.json({ success: true, data: DOCUMENT, meta: null })))

    const { result } = renderHook(() => useDocument('d1'), { wrapper: createQueryClientWrapper() })

    expect(result.current.isLoading).toBe(true)
  })

  it('returns data on success', async () => {
    server.use(http.get(`${API_BASE_URL}/documents/:id`, () => HttpResponse.json({ success: true, data: DOCUMENT, meta: null })))

    const { result } = renderHook(() => useDocument('d1'), { wrapper: createQueryClientWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(DOCUMENT)
  })

  it('returns an error when the document is not found', async () => {
    server.use(
      http.get(`${API_BASE_URL}/documents/:id`, () =>
        HttpResponse.json({ success: false, error: { code: 'DOCUMENT_001', message: 'Document not found', details: null } }, { status: 404 }),
      ),
    )

    const { result } = renderHook(() => useDocument('missing'), { wrapper: createQueryClientWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('returns an error when access is denied', async () => {
    server.use(
      http.get(`${API_BASE_URL}/documents/:id`, () =>
        HttpResponse.json({ success: false, error: { code: 'DOCUMENT_001', message: 'Document not found', details: null } }, { status: 403 }),
      ),
    )

    const { result } = renderHook(() => useDocument('not-mine'), { wrapper: createQueryClientWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
