import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { server } from '@/test/msw/server'
import { documentService } from './document.service'

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

function hasMultipartFile(body: string, name: string, filename?: string): boolean {
  const pattern = filename
    ? new RegExp(`name="${name}"; filename="${filename}"`)
    : new RegExp(`name="${name}"; filename="[^"]*"`)
  return pattern.test(body)
}

describe('documentService', () => {
  it('getAll requests /documents with the given params and unwraps the envelope', async () => {
    let capturedUrl: URL | undefined
    server.use(
      http.get(`${API_BASE_URL}/documents`, ({ request }) => {
        capturedUrl = new URL(request.url)
        return HttpResponse.json({
          success: true,
          data: [DOCUMENT],
          meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
        })
      }),
    )

    const result = await documentService.getAll({ page: 1, limit: 20, search: 'passport' })

    expect(capturedUrl?.searchParams.get('page')).toBe('1')
    expect(capturedUrl?.searchParams.get('limit')).toBe('20')
    expect(capturedUrl?.searchParams.get('search')).toBe('passport')
    expect(result.data).toEqual([DOCUMENT])
    expect(result.meta).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 })
  })

  it('getById requests /documents/{id} and returns the document', async () => {
    server.use(
      http.get(`${API_BASE_URL}/documents/:id`, ({ params }) => {
        expect(params.id).toBe('d1')
        return HttpResponse.json({ success: true, data: DOCUMENT, meta: null })
      }),
    )

    const result = await documentService.getById('d1')

    expect(result).toEqual(DOCUMENT)
  })

  it('upload POSTs multipart form data with file, title, and docType, and returns the created document', async () => {
    let capturedBody = ''
    let capturedContentType: string | null = null
    server.use(
      http.post(`${API_BASE_URL}/documents`, async ({ request }) => {
        capturedContentType = request.headers.get('content-type')
        capturedBody = await request.text()
        return HttpResponse.json({ success: true, data: DOCUMENT, meta: null }, { status: 201 })
      }),
    )

    const file = new File(['fake-bytes'], 'passport.png', { type: 'image/png' })
    const result = await documentService.upload({ file, title: 'Passport front page', docType: 'identity_civil_status' })

    expect(capturedContentType).toContain('multipart/form-data')
    expect(getMultipartField(capturedBody, 'title')).toBe('Passport front page')
    expect(getMultipartField(capturedBody, 'docType')).toBe('identity_civil_status')
    expect(hasMultipartFile(capturedBody, 'file')).toBe(true)
    expect(capturedBody).toContain('Content-Type: image/png')
    expect(result).toEqual(DOCUMENT)
  })

  it('upload omits docType from the form data when not provided', async () => {
    let capturedBody = ''
    server.use(
      http.post(`${API_BASE_URL}/documents`, async ({ request }) => {
        capturedBody = await request.text()
        return HttpResponse.json({ success: true, data: DOCUMENT, meta: null }, { status: 201 })
      }),
    )

    const file = new File(['fake-bytes'], 'passport.png', { type: 'image/png' })
    await documentService.upload({ file, title: 'Passport front page' })

    expect(capturedBody).not.toContain('name="docType"')
  })

  it('download GETs /documents/{id}/download and returns a Blob', async () => {
    server.use(
      http.get(`${API_BASE_URL}/documents/:id/download`, ({ params }) => {
        expect(params.id).toBe('d1')
        return new HttpResponse(new Blob(['file-content'], { type: 'image/png' }), {
          headers: { 'Content-Type': 'image/png' },
        })
      }),
    )

    const result = await documentService.download('d1')

    expect(result).toBeInstanceOf(Blob)
  })

  it('remove DELETEs /documents/{id}', async () => {
    let called = false
    server.use(
      http.delete(`${API_BASE_URL}/documents/:id`, ({ params }) => {
        called = true
        expect(params.id).toBe('d1')
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await documentService.remove('d1')

    expect(called).toBe(true)
  })
})
