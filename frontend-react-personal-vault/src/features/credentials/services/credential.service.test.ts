import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { server } from '@/test/msw/server'
import { credentialService } from './credential.service'

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

describe('credentialService', () => {
  it('getAll requests /credentials with the given params and unwraps the envelope', async () => {
    let capturedUrl: URL | undefined
    server.use(
      http.get(`${API_BASE_URL}/credentials`, ({ request }) => {
        capturedUrl = new URL(request.url)
        return HttpResponse.json({
          success: true,
          data: [CREDENTIAL],
          meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
        })
      }),
    )

    const result = await credentialService.getAll({ page: 1, limit: 20, search: 'gmail' })

    expect(capturedUrl?.searchParams.get('page')).toBe('1')
    expect(capturedUrl?.searchParams.get('limit')).toBe('20')
    expect(capturedUrl?.searchParams.get('search')).toBe('gmail')
    expect(result.data).toEqual([CREDENTIAL])
    expect(result.meta).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 })
  })

  it('getById requests /credentials/{id} and unwraps the envelope', async () => {
    server.use(
      http.get(`${API_BASE_URL}/credentials/:id`, ({ params }) => {
        expect(params.id).toBe('c1')
        return HttpResponse.json({ success: true, data: CREDENTIAL, meta: null })
      }),
    )

    const result = await credentialService.getById('c1')

    expect(result).toEqual(CREDENTIAL)
  })

  it('create POSTs to /credentials with the given payload and returns the created credential', async () => {
    let capturedBody: unknown
    server.use(
      http.post(`${API_BASE_URL}/credentials`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ success: true, data: CREDENTIAL, meta: null }, { status: 201 })
      }),
    )

    const payload = {
      platformName: 'Gmail',
      account: 'user@example.com',
      encryptedPassword: 'ZmFrZS1pdg==:ZmFrZS1jaXBoZXJ0ZXh0',
      note: null,
    }
    const result = await credentialService.create(payload)

    expect(capturedBody).toEqual(payload)
    // The service must never see or forward plaintext — only the pre-encrypted value passed in.
    expect(JSON.stringify(capturedBody)).not.toContain('plaintext')
    expect(result).toEqual(CREDENTIAL)
  })

  it('update PATCHes /credentials/{id} with the given payload and returns the updated credential', async () => {
    let capturedBody: unknown
    server.use(
      http.patch(`${API_BASE_URL}/credentials/:id`, async ({ request, params }) => {
        expect(params.id).toBe('c1')
        capturedBody = await request.json()
        return HttpResponse.json({ success: true, data: { ...CREDENTIAL, note: 'Updated' }, meta: null })
      }),
    )

    const result = await credentialService.update('c1', { note: 'Updated' })

    expect(capturedBody).toEqual({ note: 'Updated' })
    expect(result.note).toBe('Updated')
  })

  it('remove DELETEs /credentials/{id}', async () => {
    let called = false
    server.use(
      http.delete(`${API_BASE_URL}/credentials/:id`, ({ params }) => {
        called = true
        expect(params.id).toBe('c1')
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await credentialService.remove('c1')

    expect(called).toBe(true)
  })
})
