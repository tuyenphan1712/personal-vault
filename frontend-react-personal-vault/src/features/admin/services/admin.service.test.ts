import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { server } from '@/test/msw/server'
import { adminService } from './admin.service'

const USER = {
  id: 'u1',
  phone: '0900000001',
  fullName: 'Test User',
  role: 'member' as const,
  status: 'active' as const,
  createdAt: '2026-01-01T00:00:00Z',
}

describe('adminService', () => {
  it('getAll requests /admin/users with the given params and unwraps the envelope', async () => {
    let capturedUrl: URL | undefined
    server.use(
      http.get(`${API_BASE_URL}/admin/users`, ({ request }) => {
        capturedUrl = new URL(request.url)
        return HttpResponse.json({
          success: true,
          data: [USER],
          meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
        })
      }),
    )

    const result = await adminService.getAll({ page: 1, limit: 20, search: 'test' })

    expect(capturedUrl?.searchParams.get('page')).toBe('1')
    expect(capturedUrl?.searchParams.get('limit')).toBe('20')
    expect(capturedUrl?.searchParams.get('search')).toBe('test')
    expect(result.data).toEqual([USER])
    expect(result.meta).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 })
  })

  it('updateStatus PATCHes /admin/users/{id}/status with the new status and returns the updated user', async () => {
    let capturedBody: unknown
    server.use(
      http.patch(`${API_BASE_URL}/admin/users/:id/status`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ success: true, data: { ...USER, status: 'locked' }, meta: null })
      }),
    )

    const result = await adminService.updateStatus('u1', { status: 'locked' })

    expect(capturedBody).toEqual({ status: 'locked' })
    expect(result.status).toBe('locked')
  })

  it('remove DELETEs /admin/users/{id}', async () => {
    let called = false
    server.use(
      http.delete(`${API_BASE_URL}/admin/users/:id`, ({ params }) => {
        called = true
        expect(params.id).toBe('u1')
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await adminService.remove('u1')

    expect(called).toBe(true)
  })
})
