import { renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { server } from '@/test/msw/server'
import { withQueryClient } from '@/test/QueryClientWrapper'
import { createTestQueryClient } from '@/test/testQueryClient'
import { decryptValue, deriveEncryptionKey, encryptValue } from '@/shared/lib/crypto'
import { getEncryptionKey, setEncryptionKey } from '@/shared/lib/keyStore'
import { useAuthStore } from '../stores/auth.store'
import { IncorrectCurrentPasswordError, useChangePassword } from './useChangePassword'

const USER_ID = 'user-1'
const OLD_PASSWORD = 'old-vault-password'
const NEW_PASSWORD = 'new-vault-password-123'

function credentialFixture(overrides: Partial<Record<'id' | 'encryptedPassword' | 'encryptedPin', string | null>> = {}) {
  return {
    id: overrides.id ?? 'c1',
    platformName: 'Gmail',
    account: 'user@example.com',
    encryptedPassword: overrides.encryptedPassword ?? '',
    ciphertextVersion: 1,
    encryptedPin: overrides.encryptedPin ?? null,
    note: null,
    createdAt: 't',
    updatedAt: 't',
  }
}

describe('useChangePassword', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: { id: USER_ID, phone: '0900000000', fullName: 'Test User', role: 'member' } })
  })

  afterEach(() => {
    setEncryptionKey(null)
    useAuthStore.setState({ user: null, isAuthenticated: false })
  })

  it('re-encrypts every owned credential under the new key and installs the new key', async () => {
    const oldKey = await deriveEncryptionKey(OLD_PASSWORD, USER_ID)
    const newKey = await deriveEncryptionKey(NEW_PASSWORD, USER_ID)

    const credentialA = credentialFixture({
      id: 'c1',
      encryptedPassword: await encryptValue('plaintext-password-a', oldKey),
      encryptedPin: await encryptValue('1234', oldKey),
    })
    const credentialB = credentialFixture({
      id: 'c2',
      encryptedPassword: await encryptValue('plaintext-password-b', oldKey),
      encryptedPin: null,
    })

    server.use(
      http.get(`${API_BASE_URL}/credentials`, () =>
        HttpResponse.json({
          success: true,
          data: [credentialA, credentialB],
          meta: { page: 1, limit: 100, total: 2, totalPages: 1 },
        }),
      ),
    )

    let capturedBody: { credentials: Array<{ id: string; encryptedPassword: string; encryptedPin: string | null }> } | undefined
    server.use(
      http.post(`${API_BASE_URL}/auth/change-password`, async ({ request }) => {
        capturedBody = (await request.json()) as typeof capturedBody
        return HttpResponse.json({ success: true, data: null, meta: null })
      }),
    )

    const { wrapper } = withQueryClient(createTestQueryClient())
    const { result } = renderHook(() => useChangePassword(), { wrapper })

    result.current.mutate({ currentPassword: OLD_PASSWORD, newPassword: NEW_PASSWORD })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const updateA = capturedBody!.credentials.find((c) => c.id === 'c1')!
    const updateB = capturedBody!.credentials.find((c) => c.id === 'c2')!
    expect(await decryptValue(updateA.encryptedPassword, newKey)).toBe('plaintext-password-a')
    expect(await decryptValue(updateA.encryptedPin!, newKey)).toBe('1234')
    expect(await decryptValue(updateB.encryptedPassword, newKey)).toBe('plaintext-password-b')
    expect(updateB.encryptedPin).toBeNull()

    const installedKey = getEncryptionKey()
    expect(installedKey).not.toBeNull()
    expect(await decryptValue(updateA.encryptedPassword, installedKey!)).toBe('plaintext-password-a')
  })

  it('fetches every page of credentials before re-encrypting', async () => {
    const oldKey = await deriveEncryptionKey(OLD_PASSWORD, USER_ID)
    await deriveEncryptionKey(NEW_PASSWORD, USER_ID)

    const credentialPage1 = credentialFixture({ id: 'c1', encryptedPassword: await encryptValue('page-1-secret', oldKey) })
    const credentialPage2 = credentialFixture({ id: 'c2', encryptedPassword: await encryptValue('page-2-secret', oldKey) })

    server.use(
      http.get(`${API_BASE_URL}/credentials`, ({ request }) => {
        const page = new URL(request.url).searchParams.get('page')
        if (page === '2') {
          return HttpResponse.json({
            success: true,
            data: [credentialPage2],
            meta: { page: 2, limit: 100, total: 2, totalPages: 2 },
          })
        }
        return HttpResponse.json({
          success: true,
          data: [credentialPage1],
          meta: { page: 1, limit: 100, total: 2, totalPages: 2 },
        })
      }),
    )

    let capturedBody: { credentials: Array<{ id: string }> } | undefined
    server.use(
      http.post(`${API_BASE_URL}/auth/change-password`, async ({ request }) => {
        capturedBody = (await request.json()) as typeof capturedBody
        return HttpResponse.json({ success: true, data: null, meta: null })
      }),
    )

    const { wrapper } = withQueryClient(createTestQueryClient())
    const { result } = renderHook(() => useChangePassword(), { wrapper })

    result.current.mutate({ currentPassword: OLD_PASSWORD, newPassword: NEW_PASSWORD })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(capturedBody!.credentials.map((c) => c.id).sort()).toEqual(['c1', 'c2'])
  })

  it('fails fast with IncorrectCurrentPasswordError and never calls the API when the current password is wrong', async () => {
    const actualOldKey = await deriveEncryptionKey(OLD_PASSWORD, USER_ID)
    const credential = credentialFixture({ id: 'c1', encryptedPassword: await encryptValue('plaintext-password-a', actualOldKey) })

    server.use(
      http.get(`${API_BASE_URL}/credentials`, () =>
        HttpResponse.json({ success: true, data: [credential], meta: { page: 1, limit: 100, total: 1, totalPages: 1 } }),
      ),
    )
    let changePasswordCalled = false
    server.use(
      http.post(`${API_BASE_URL}/auth/change-password`, () => {
        changePasswordCalled = true
        return HttpResponse.json({ success: true, data: null, meta: null })
      }),
    )

    const { wrapper } = withQueryClient(createTestQueryClient())
    const { result } = renderHook(() => useChangePassword(), { wrapper })

    result.current.mutate({ currentPassword: 'totally-wrong-password', newPassword: NEW_PASSWORD })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(IncorrectCurrentPasswordError)
    expect(changePasswordCalled).toBe(false)
    expect(getEncryptionKey()).toBeNull()
  })

  it('propagates a stale-credential-set conflict from the server and does not install the new key', async () => {
    server.use(
      http.get(`${API_BASE_URL}/credentials`, () =>
        HttpResponse.json({ success: true, data: [], meta: { page: 1, limit: 100, total: 0, totalPages: 0 } }),
      ),
    )
    server.use(
      http.post(`${API_BASE_URL}/auth/change-password`, () =>
        HttpResponse.json(
          { success: false, error: { code: 'CREDENTIAL_002', message: 'Credential set is stale or incomplete', details: null } },
          { status: 409 },
        ),
      ),
    )

    const { wrapper } = withQueryClient(createTestQueryClient())
    const { result } = renderHook(() => useChangePassword(), { wrapper })

    result.current.mutate({ currentPassword: OLD_PASSWORD, newPassword: NEW_PASSWORD })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(getEncryptionKey()).toBeNull()
  })
})
