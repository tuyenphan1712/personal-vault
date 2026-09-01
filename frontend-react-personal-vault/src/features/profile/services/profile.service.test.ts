import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { server } from '@/test/msw/server'
import { profileService } from './profile.service'

const PROFILE = {
  id: 'u1',
  phone: '0900000001',
  fullName: 'Jane Doe',
  role: 'member' as const,
  status: 'active' as const,
  birthday: '1990-01-01',
}

describe('profileService', () => {
  it('get requests GET /profile and unwraps the envelope', async () => {
    let called = false
    server.use(
      http.get(`${API_BASE_URL}/profile`, () => {
        called = true
        return HttpResponse.json({ success: true, data: PROFILE, meta: null })
      }),
    )

    const result = await profileService.get()

    expect(called).toBe(true)
    expect(result).toEqual(PROFILE)
  })

  it('update PATCHes /profile with only fullName and birthday, and unwraps the envelope', async () => {
    let capturedBody: unknown
    server.use(
      http.patch(`${API_BASE_URL}/profile`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ success: true, data: { ...PROFILE, fullName: 'John Doe' }, meta: null })
      }),
    )

    const result = await profileService.update({ fullName: 'John Doe', birthday: '1990-01-01' })

    expect(capturedBody).toEqual({ fullName: 'John Doe', birthday: '1990-01-01' })
    expect(result.fullName).toBe('John Doe')
  })

  it('update sends birthday as null when clearing it', async () => {
    let capturedBody: unknown
    server.use(
      http.patch(`${API_BASE_URL}/profile`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ success: true, data: { ...PROFILE, birthday: null }, meta: null })
      }),
    )

    await profileService.update({ fullName: 'Jane Doe', birthday: null })

    expect(capturedBody).toEqual({ fullName: 'Jane Doe', birthday: null })
  })
})
