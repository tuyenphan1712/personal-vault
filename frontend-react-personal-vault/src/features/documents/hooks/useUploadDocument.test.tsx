import { renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { server } from '@/test/msw/server'
import { withQueryClient } from '@/test/QueryClientWrapper'
import { createTestQueryClient } from '@/test/testQueryClient'
import { documentKeys } from './documentKeys'
import { useUploadDocument } from './useUploadDocument'

const DOCUMENT = {
  id: 'd1',
  title: 'Passport front page',
  docType: 'identity_civil_status',
  mimeType: 'image/png',
  fileSize: 482113,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

/**
 * jsdom's `File` isn't recognized by undici's strict multipart parser used internally by
 * MSW/Node's fetch runtime, so `request.formData()` throws when a real `File` is part of the
 * body (a test-environment limitation, not an app bug). Reading the raw multipart body as text
 * and pulling out each part's value works around it while still verifying what was actually sent.
 */
function getMultipartField(body: string, name: string): string | undefined {
  const match = body.match(new RegExp(`name="${name}"\\r?\\n\\r?\\n([^\\r\\n]*)`))
  return match?.[1]
}

describe('useUploadDocument', () => {
  it('calls the service on mutate and returns the created document', async () => {
    let capturedBody = ''
    server.use(
      http.post(`${API_BASE_URL}/documents`, async ({ request }) => {
        capturedBody = await request.text()
        return HttpResponse.json({ success: true, data: DOCUMENT, meta: null }, { status: 201 })
      }),
    )

    const { wrapper } = withQueryClient(createTestQueryClient())
    const { result } = renderHook(() => useUploadDocument(), { wrapper })

    const file = new File(['fake-bytes'], 'passport.png', { type: 'image/png' })
    result.current.mutate({ file, title: 'Passport front page', docType: 'identity_civil_status' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getMultipartField(capturedBody, 'title')).toBe('Passport front page')
    expect(result.current.data).toEqual(DOCUMENT)
  })

  it('invalidates the documents query on success', async () => {
    server.use(http.post(`${API_BASE_URL}/documents`, () => HttpResponse.json({ success: true, data: DOCUMENT, meta: null }, { status: 201 })))

    const { wrapper, queryClient } = withQueryClient(createTestQueryClient())
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useUploadDocument(), { wrapper })

    const file = new File(['fake-bytes'], 'passport.png', { type: 'image/png' })
    result.current.mutate({ file, title: 'Passport front page' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: documentKeys.all })
  })

  it('surfaces an error when the file is rejected as too large', async () => {
    server.use(
      http.post(`${API_BASE_URL}/documents`, () =>
        HttpResponse.json({ success: false, error: { code: 'DOCUMENT_003', message: 'File is too large', details: null } }, { status: 413 }),
      ),
    )

    const { wrapper } = withQueryClient(createTestQueryClient())
    const { result } = renderHook(() => useUploadDocument(), { wrapper })

    const file = new File(['fake-bytes'], 'big.png', { type: 'image/png' })
    result.current.mutate({ file, title: 'Big file' })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('surfaces an error when the file type is unsupported', async () => {
    server.use(
      http.post(`${API_BASE_URL}/documents`, () =>
        HttpResponse.json({ success: false, error: { code: 'DOCUMENT_002', message: 'File type is unsupported', details: null } }, { status: 415 }),
      ),
    )

    const { wrapper } = withQueryClient(createTestQueryClient())
    const { result } = renderHook(() => useUploadDocument(), { wrapper })

    const file = new File(['fake-bytes'], 'malware.exe', { type: 'application/octet-stream' })
    result.current.mutate({ file, title: 'Bad file' })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
