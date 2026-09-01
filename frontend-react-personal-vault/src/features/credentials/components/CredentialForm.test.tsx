import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import type { ComponentProps } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { createQueryClientWrapper } from '@/test/QueryClientWrapper'
import { server } from '@/test/msw/server'
import { decryptValue, deriveEncryptionKey } from '@/shared/lib/crypto'
import { getEncryptionKey, setEncryptionKey } from '@/shared/lib/keyStore'
import type { Credential } from '../types/credential.types'
import { CredentialForm } from './CredentialForm'

const PLAINTEXT_PASSWORD = 'correct-horse-battery-staple'

const EXISTING_CREDENTIAL: Credential = {
  id: 'c1',
  platformName: 'Gmail',
  account: 'user@example.com',
  encryptedPassword: 'aXY=:Y2lwaGVy',
  ciphertextVersion: 1,
  note: 'Personal',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

function renderForm(props: Partial<ComponentProps<typeof CredentialForm>> = {}) {
  const Wrapper = createQueryClientWrapper()
  return render(
    <Wrapper>
      <CredentialForm onSuccess={vi.fn()} {...props} />
    </Wrapper>,
  )
}

describe('CredentialForm', () => {
  afterEach(() => {
    setEncryptionKey(null)
  })

  it('renders all form fields for a new credential', () => {
    renderForm()

    expect(screen.getByLabelText('Platform')).toBeInTheDocument()
    expect(screen.getByLabelText('Account')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Note (optional)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add credential' })).toBeInTheDocument()
  })

  it('pre-fills fields when editing an existing credential and shows the edit button label', () => {
    renderForm({ credential: EXISTING_CREDENTIAL })

    expect(screen.getByLabelText('Platform')).toHaveValue('Gmail')
    expect(screen.getByLabelText('Account')).toHaveValue('user@example.com')
    expect(screen.getByLabelText('Note (optional)')).toHaveValue('Personal')
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument()
  })

  it('shows validation errors when required fields are empty', async () => {
    setEncryptionKey(await deriveEncryptionKey('unlock-pass', 'user-1'))
    renderForm()

    await userEvent.click(screen.getByRole('button', { name: 'Add credential' }))

    expect(await screen.findByText('Platform name is required')).toBeInTheDocument()
    expect(screen.getByText('Account is required')).toBeInTheDocument()
    expect(screen.getByText('Password is required')).toBeInTheDocument()
  })

  it('sends an AES-GCM encrypted payload on submit that never contains the plaintext password', async () => {
    const key = await deriveEncryptionKey('unlock-pass', 'user-1')
    setEncryptionKey(key)

    let capturedBody: { encryptedPassword?: string; platformName?: string; account?: string } | undefined
    server.use(
      http.post(`${API_BASE_URL}/credentials`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({
          success: true,
          data: { ...EXISTING_CREDENTIAL, encryptedPassword: capturedBody?.encryptedPassword ?? '' },
          meta: null,
        })
      }),
    )

    const onSuccess = vi.fn()
    renderForm({ onSuccess })

    await userEvent.type(screen.getByLabelText('Platform'), 'Gmail')
    await userEvent.type(screen.getByLabelText('Account'), 'user@example.com')
    await userEvent.type(screen.getByLabelText('Password'), PLAINTEXT_PASSWORD)
    await userEvent.click(screen.getByRole('button', { name: 'Add credential' }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith('Sealed and saved.'))

    expect(capturedBody?.encryptedPassword).toBeTruthy()
    expect(capturedBody?.encryptedPassword).not.toBe(PLAINTEXT_PASSWORD)
    expect(capturedBody?.encryptedPassword).not.toContain(PLAINTEXT_PASSWORD)
    expect(JSON.stringify(capturedBody)).not.toContain(PLAINTEXT_PASSWORD)

    // The ciphertext is the real AES-GCM wire format and decrypts back to the typed password —
    // proves the form actually encrypted it rather than sending an unrelated placeholder.
    const decrypted = await decryptValue(capturedBody!.encryptedPassword!, key)
    expect(decrypted).toBe(PLAINTEXT_PASSWORD)
  })

  it('sends an updated encrypted payload on submit when editing', async () => {
    const key = await deriveEncryptionKey('unlock-pass', 'user-1')
    setEncryptionKey(key)

    let capturedBody: { encryptedPassword?: string } | undefined
    server.use(
      http.patch(`${API_BASE_URL}/credentials/:id`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ success: true, data: EXISTING_CREDENTIAL, meta: null })
      }),
    )

    const onSuccess = vi.fn()
    renderForm({ credential: EXISTING_CREDENTIAL, onSuccess })

    await userEvent.type(screen.getByLabelText('Password'), 'new-password-123')
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith('Changes sealed.'))
    expect(capturedBody?.encryptedPassword).not.toContain('new-password-123')
  })

  it('does not submit when the vault is locked (no encryption key available)', async () => {
    expect(getEncryptionKey()).toBeNull()
    let called = false
    server.use(
      http.post(`${API_BASE_URL}/credentials`, () => {
        called = true
        return HttpResponse.json({ success: true, data: EXISTING_CREDENTIAL, meta: null })
      }),
    )

    renderForm()

    await userEvent.type(screen.getByLabelText('Platform'), 'Gmail')
    await userEvent.type(screen.getByLabelText('Account'), 'user@example.com')
    await userEvent.type(screen.getByLabelText('Password'), PLAINTEXT_PASSWORD)
    await userEvent.click(screen.getByRole('button', { name: 'Add credential' }))

    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(called).toBe(false)
  })

  it('shows an error message and does not call onSuccess when saving fails', async () => {
    setEncryptionKey(await deriveEncryptionKey('unlock-pass', 'user-1'))
    server.use(
      http.post(`${API_BASE_URL}/credentials`, () =>
        HttpResponse.json({ success: false, error: { code: 'COMMON_001', message: 'Validation failed', details: null } }, { status: 400 }),
      ),
    )
    const onSuccess = vi.fn()
    renderForm({ onSuccess })

    await userEvent.type(screen.getByLabelText('Platform'), 'Gmail')
    await userEvent.type(screen.getByLabelText('Account'), 'user@example.com')
    await userEvent.type(screen.getByLabelText('Password'), PLAINTEXT_PASSWORD)
    await userEvent.click(screen.getByRole('button', { name: 'Add credential' }))

    expect(await screen.findByText("Couldn't save this credential. Try again.")).toBeInTheDocument()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('never logs the plaintext password anywhere during submit', async () => {
    const key = await deriveEncryptionKey('unlock-pass', 'user-1')
    setEncryptionKey(key)
    server.use(
      http.post(`${API_BASE_URL}/credentials`, () => HttpResponse.json({ success: true, data: EXISTING_CREDENTIAL, meta: null })),
    )
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const onSuccess = vi.fn()
    renderForm({ onSuccess })
    await userEvent.type(screen.getByLabelText('Platform'), 'Gmail')
    await userEvent.type(screen.getByLabelText('Account'), 'user@example.com')
    await userEvent.type(screen.getByLabelText('Password'), PLAINTEXT_PASSWORD)
    await userEvent.click(screen.getByRole('button', { name: 'Add credential' }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())

    for (const call of [...logSpy.mock.calls, ...errorSpy.mock.calls]) {
      expect(JSON.stringify(call)).not.toContain(PLAINTEXT_PASSWORD)
    }

    logSpy.mockRestore()
    errorSpy.mockRestore()
  })
})
