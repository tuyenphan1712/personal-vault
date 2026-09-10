import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { createQueryClientWrapper } from '@/test/QueryClientWrapper'
import { server } from '@/test/msw/server'
import { encryptValue, deriveEncryptionKey } from '@/shared/lib/crypto'
import { getEncryptionKey, setEncryptionKey } from '@/shared/lib/keyStore'
import { useAuthStore } from '../stores/auth.store'
import { ChangePasswordForm } from './ChangePasswordForm'

const USER_ID = 'user-1'

function renderForm(onSuccess = vi.fn()) {
  const Wrapper = createQueryClientWrapper()
  render(
    <Wrapper>
      <ChangePasswordForm onSuccess={onSuccess} />
    </Wrapper>,
  )
  return { onSuccess }
}

function emptyCredentialsList() {
  server.use(
    http.get(`${API_BASE_URL}/credentials`, () =>
      HttpResponse.json({ success: true, data: [], meta: { page: 1, limit: 100, total: 0, totalPages: 0 } }),
    ),
  )
}

describe('ChangePasswordForm', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: { id: USER_ID, phone: '0900000000', fullName: 'Test User', role: 'member' } })
  })

  afterEach(() => {
    setEncryptionKey(null)
    useAuthStore.setState({ user: null, isAuthenticated: false })
  })

  it('renders all fields', () => {
    renderForm()

    expect(screen.getByLabelText('Current password')).toBeInTheDocument()
    expect(screen.getByLabelText('New password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm new password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Change password' })).toBeInTheDocument()
  })

  it('shows a validation error when the confirmation does not match the new password', async () => {
    renderForm()

    await userEvent.type(screen.getByLabelText('Current password'), 'old-password')
    await userEvent.type(screen.getByLabelText('New password'), 'new-password-123')
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'does-not-match')
    await userEvent.click(screen.getByRole('button', { name: 'Change password' }))

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument()
  })

  it('shows a validation error when the new password is too short', async () => {
    renderForm()

    await userEvent.type(screen.getByLabelText('Current password'), 'old-password')
    await userEvent.type(screen.getByLabelText('New password'), 'short')
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'short')
    await userEvent.click(screen.getByRole('button', { name: 'Change password' }))

    expect(await screen.findByText('Password must be at least 8 characters')).toBeInTheDocument()
  })

  it('shows a password strength hint for the new password field that updates as the user types', async () => {
    renderForm()

    await userEvent.type(screen.getByLabelText('New password'), 'abc')
    expect(await screen.findByText('Weak password')).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('New password'), 'defghij1!')
    expect(await screen.findByText('Strong password')).toBeInTheDocument()
  })

  it('calls onSuccess after changing the password when the user owns no credentials', async () => {
    emptyCredentialsList()
    server.use(
      http.post(`${API_BASE_URL}/auth/change-password`, () => HttpResponse.json({ success: true, data: null, meta: null })),
    )
    const { onSuccess } = renderForm()

    await userEvent.type(screen.getByLabelText('Current password'), 'old-password')
    await userEvent.type(screen.getByLabelText('New password'), 'new-password-123')
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'new-password-123')
    await userEvent.click(screen.getByRole('button', { name: 'Change password' }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(getEncryptionKey()).not.toBeNull()
  })

  it('shows an incorrect-current-password error and does not call onSuccess', async () => {
    const actualOldKey = await deriveEncryptionKey('actual-old-password', USER_ID)
    server.use(
      http.get(`${API_BASE_URL}/credentials`, async () =>
        HttpResponse.json({
          success: true,
          data: [
            {
              id: 'c1',
              platformName: 'Gmail',
              account: 'user@example.com',
              encryptedPassword: await encryptValue('plaintext', actualOldKey),
              ciphertextVersion: 1,
              encryptedPin: null,
              note: null,
              createdAt: 't',
              updatedAt: 't',
            },
          ],
          meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
        }),
      ),
    )
    const { onSuccess } = renderForm()

    await userEvent.type(screen.getByLabelText('Current password'), 'totally-wrong-password')
    await userEvent.type(screen.getByLabelText('New password'), 'new-password-123')
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'new-password-123')
    await userEvent.click(screen.getByRole('button', { name: 'Change password' }))

    expect(await screen.findByText('Current password is incorrect')).toBeInTheDocument()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('shows a retry message when the credential set is stale', async () => {
    emptyCredentialsList()
    server.use(
      http.post(`${API_BASE_URL}/auth/change-password`, () =>
        HttpResponse.json(
          { success: false, error: { code: 'CREDENTIAL_002', message: 'Credential set is stale or incomplete', details: null } },
          { status: 409 },
        ),
      ),
    )
    const { onSuccess } = renderForm()

    await userEvent.type(screen.getByLabelText('Current password'), 'old-password')
    await userEvent.type(screen.getByLabelText('New password'), 'new-password-123')
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'new-password-123')
    await userEvent.click(screen.getByRole('button', { name: 'Change password' }))

    expect(await screen.findByText('Your credentials changed while this form was open. Please try again.')).toBeInTheDocument()
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
