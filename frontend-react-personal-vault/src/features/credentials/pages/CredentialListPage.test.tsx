import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { useAuthStore } from '@/features/auth'
import { createQueryClientWrapper } from '@/test/QueryClientWrapper'
import { server } from '@/test/msw/server'
import { setEncryptionKey } from '@/shared/lib/keyStore'
import type { Credential } from '../types/credential.types'
import { CredentialListPage } from './CredentialListPage'

const CREDENTIALS: Credential[] = [
  { id: 'c1', platformName: 'Gmail', account: 'user@example.com', encryptedPassword: 'aXY=:Y2lwaGVy', ciphertextVersion: 1, note: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
]

function renderPage() {
  useAuthStore.setState({
    user: { id: 'user-1', phone: '0900000000', fullName: 'Jane Doe', role: 'member' },
    isAuthenticated: true,
    isSessionLoading: false,
  })

  const Wrapper = createQueryClientWrapper()
  return render(
    <MemoryRouter>
      <Wrapper>
        <CredentialListPage />
      </Wrapper>
    </MemoryRouter>,
  )
}

describe('CredentialListPage', () => {
  afterEach(() => {
    setEncryptionKey(null)
    useAuthStore.setState({ user: null, isAuthenticated: false, isSessionLoading: false })
  })

  it('shows the unlock prompt instead of the list when the vault is locked', () => {
    renderPage()

    expect(screen.getByText('Your vault is sealed')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Credentials' })).not.toBeInTheDocument()
  })

  it('shows the credentials list once the vault is unlocked', async () => {
    server.use(
      http.get(`${API_BASE_URL}/credentials`, () =>
        HttpResponse.json({ success: true, data: CREDENTIALS, meta: { page: 1, limit: 20, total: 1, totalPages: 1 } }),
      ),
    )
    renderPage()

    await userEvent.type(screen.getByLabelText('Password'), 'unlock-password')
    await userEvent.click(screen.getByRole('button', { name: 'Unlock vault' }))

    expect(await screen.findByRole('heading', { name: 'Credentials' })).toBeInTheDocument()
    expect(await screen.findByText('Gmail')).toBeInTheDocument()
  })

  it('opens the add-credential modal and creates a credential end-to-end without leaking the plaintext password', async () => {
    server.use(
      http.get(`${API_BASE_URL}/credentials`, () =>
        HttpResponse.json({ success: true, data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } }),
      ),
    )
    let capturedBody: { encryptedPassword?: string } | undefined
    server.use(
      http.post(`${API_BASE_URL}/credentials`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({
          success: true,
          data: { id: 'c2', platformName: 'Facebook', account: 'me@example.com', encryptedPassword: capturedBody?.encryptedPassword ?? '', ciphertextVersion: 1, note: null, createdAt: 't', updatedAt: 't' },
          meta: null,
        })
      }),
    )

    renderPage()
    await userEvent.type(screen.getByLabelText('Password'), 'unlock-password')
    await userEvent.click(screen.getByRole('button', { name: 'Unlock vault' }))
    await screen.findByText('No credentials yet')

    await userEvent.click(screen.getByRole('button', { name: 'Add credential' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    const dialog = screen.getByRole('dialog')
    const dialogScope = within(dialog)
    await userEvent.type(dialogScope.getByLabelText('Platform'), 'Facebook')
    await userEvent.type(dialogScope.getByLabelText('Account'), 'me@example.com')
    await userEvent.type(dialogScope.getByLabelText('Password'), 'plaintext-secret')
    await userEvent.click(dialogScope.getByRole('button', { name: 'Add credential' }))

    await waitFor(() => expect(screen.getByText('Sealed and saved.')).toBeInTheDocument())
    expect(capturedBody?.encryptedPassword).toBeTruthy()
    expect(capturedBody?.encryptedPassword).not.toContain('plaintext-secret')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
