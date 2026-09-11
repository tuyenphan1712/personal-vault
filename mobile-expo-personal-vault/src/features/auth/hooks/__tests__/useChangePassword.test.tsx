import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react-native'
import { rest } from 'msw'
import type { ReactNode } from 'react'
import { API_BASE_URL } from '@/src/config/constants'
import { server } from '@/src/shared/testing/msw/server'
import { createTestQueryClient } from '@/src/shared/testing/queryClient'
import { decryptCredential, deriveEncryptionKey, encryptCredential } from '@/src/shared/lib/crypto/cryptoAdapter'
import { getEncryptionKey, setEncryptionKey } from '@/src/shared/lib/crypto/keyStore'
import { clearBiometricCredential } from '@/src/shared/lib/auth/biometricCredentialStore'
import { useBiometricStore } from '@/src/features/settings/stores/biometric.store'
import { useAuthStore } from '../../stores/auth.store'
import { IncorrectCurrentPasswordError, useChangePassword } from '../useChangePassword'

jest.mock('@/src/shared/lib/storage/secureStorage', () => ({
  getRefreshToken: jest.fn().mockResolvedValue('raw-refresh-token'),
}))

jest.mock('@/src/shared/lib/auth/biometricCredentialStore', () => ({
  clearBiometricCredential: jest.fn().mockResolvedValue(undefined),
}))

const url = (path: string) => `${API_BASE_URL}${path}`
const USER_ID = 'user-1'
const OLD_PASSWORD = 'old-vault-password'
const NEW_PASSWORD = 'new-vault-password-123'

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = createTestQueryClient()
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

function credentialFixture(
  overrides: Partial<{ id: string; encryptedPassword: string; encryptedPin: string | null }> = {},
) {
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

beforeEach(() => {
  useAuthStore.setState({
    user: { id: USER_ID, phone: '0900000000', fullName: 'Test User', role: 'member' },
    isAuthenticated: true,
    isSessionLoading: false,
    isAppLocked: false,
  })
  useBiometricStore.setState({ enabled: false })
  jest.clearAllMocks()
})

afterEach(() => {
  setEncryptionKey(null)
  useAuthStore.setState({ user: null, isAuthenticated: false })
})

describe('useChangePassword', () => {
  it('re-encrypts every owned credential under the new key, installs it, and sends the stored refresh token', async () => {
    const oldKey = await deriveEncryptionKey(OLD_PASSWORD, USER_ID)
    const newKey = await deriveEncryptionKey(NEW_PASSWORD, USER_ID)

    const credentialA = credentialFixture({
      id: 'c1',
      encryptedPassword: await encryptCredential('plaintext-a', oldKey),
      encryptedPin: await encryptCredential('1234', oldKey),
    })
    const credentialB = credentialFixture({
      id: 'c2',
      encryptedPassword: await encryptCredential('plaintext-b', oldKey),
    })

    server.use(
      rest.get(url('/credentials'), (_req, res, ctx) =>
        res(
          ctx.status(200),
          ctx.json({
            success: true,
            data: [credentialA, credentialB],
            meta: { page: 1, limit: 100, total: 2, totalPages: 1 },
          }),
        ),
      ),
    )

    let capturedBody: { currentRefreshToken?: string; credentials: Array<{ id: string; encryptedPassword: string; encryptedPin: string | null }> } | undefined
    server.use(
      rest.post(url('/auth/change-password'), async (req, res, ctx) => {
        capturedBody = await req.json()
        return res(ctx.status(200), ctx.json({ success: true, data: null, meta: null }))
      }),
    )

    const { result } = await renderHook(() => useChangePassword(), { wrapper })
    result.current.mutate({ currentPassword: OLD_PASSWORD, newPassword: NEW_PASSWORD })

    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 20000 })

    expect(capturedBody?.currentRefreshToken).toBe('raw-refresh-token')
    const updateA = capturedBody!.credentials.find((c) => c.id === 'c1')!
    const updateB = capturedBody!.credentials.find((c) => c.id === 'c2')!
    expect(await decryptCredential(updateA.encryptedPassword, newKey)).toBe('plaintext-a')
    expect(await decryptCredential(updateA.encryptedPin!, newKey)).toBe('1234')
    expect(await decryptCredential(updateB.encryptedPassword, newKey)).toBe('plaintext-b')
    expect(updateB.encryptedPin).toBeNull()

    expect(getEncryptionKey()).not.toBeNull()
  }, 30000)

  it('fails fast with IncorrectCurrentPasswordError and never calls the API when the current password is wrong', async () => {
    const actualOldKey = await deriveEncryptionKey(OLD_PASSWORD, USER_ID)
    const credential = credentialFixture({ id: 'c1', encryptedPassword: await encryptCredential('plaintext-a', actualOldKey) })

    server.use(
      rest.get(url('/credentials'), (_req, res, ctx) =>
        res(ctx.status(200), ctx.json({ success: true, data: [credential], meta: { page: 1, limit: 100, total: 1, totalPages: 1 } })),
      ),
    )
    let called = false
    server.use(
      rest.post(url('/auth/change-password'), (_req, res, ctx) => {
        called = true
        return res(ctx.status(200), ctx.json({ success: true, data: null, meta: null }))
      }),
    )

    const { result } = await renderHook(() => useChangePassword(), { wrapper })
    result.current.mutate({ currentPassword: 'totally-wrong-password', newPassword: NEW_PASSWORD })

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 20000 })
    expect(result.current.error).toBeInstanceOf(IncorrectCurrentPasswordError)
    expect(called).toBe(false)
    expect(getEncryptionKey()).toBeNull()
  }, 30000)

  it('propagates a stale-credential-set conflict from the server and does not install the new key', async () => {
    server.use(
      rest.get(url('/credentials'), (_req, res, ctx) =>
        res(ctx.status(200), ctx.json({ success: true, data: [], meta: { page: 1, limit: 100, total: 0, totalPages: 0 } })),
      ),
    )
    server.use(
      rest.post(url('/auth/change-password'), (_req, res, ctx) =>
        res(
          ctx.status(409),
          ctx.json({ success: false, error: { code: 'CREDENTIAL_002', message: 'Credential set is stale or incomplete', details: null } }),
        ),
      ),
    )

    const { result } = await renderHook(() => useChangePassword(), { wrapper })
    result.current.mutate({ currentPassword: OLD_PASSWORD, newPassword: NEW_PASSWORD })

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 20000 })
    expect(getEncryptionKey()).toBeNull()
  }, 30000)

  it('clears the wrapped biometric credential and disables the biometric preference on success', async () => {
    useBiometricStore.setState({ enabled: true })

    server.use(
      rest.get(url('/credentials'), (_req, res, ctx) =>
        res(ctx.status(200), ctx.json({ success: true, data: [], meta: { page: 1, limit: 100, total: 0, totalPages: 0 } })),
      ),
    )
    server.use(
      rest.post(url('/auth/change-password'), (_req, res, ctx) => res(ctx.status(200), ctx.json({ success: true, data: null, meta: null }))),
    )

    const { result } = await renderHook(() => useChangePassword(), { wrapper })
    result.current.mutate({ currentPassword: OLD_PASSWORD, newPassword: NEW_PASSWORD })

    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 20000 })

    expect(clearBiometricCredential).toHaveBeenCalled()
    expect(useBiometricStore.getState().enabled).toBe(false)
  }, 30000)
})
