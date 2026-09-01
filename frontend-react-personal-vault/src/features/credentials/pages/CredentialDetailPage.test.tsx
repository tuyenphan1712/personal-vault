import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { useAuthStore } from '@/features/auth'
import { createQueryClientWrapper } from '@/test/QueryClientWrapper'
import { server } from '@/test/msw/server'
import { deriveEncryptionKey } from '@/shared/lib/crypto'
import { setEncryptionKey } from '@/shared/lib/keyStore'
import { CredentialDetailPage } from './CredentialDetailPage'

const CREDENTIAL = {
  id: 'c1',
  platformName: 'Gmail',
  account: 'user@example.com',
  encryptedPassword: 'aXY=:Y2lwaGVy',
  ciphertextVersion: 1,
  note: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

function renderPage(id = 'c1') {
  useAuthStore.setState({
    user: { id: 'user-1', phone: '0900000000', fullName: 'Jane Doe', role: 'member' },
    isAuthenticated: true,
    isSessionLoading: false,
  })

  const Wrapper = createQueryClientWrapper()
  return render(
    <MemoryRouter initialEntries={[`/credentials/${id}`]}>
      <Wrapper>
        <Routes>
          <Route path="/credentials/:id" element={<CredentialDetailPage />} />
        </Routes>
      </Wrapper>
    </MemoryRouter>,
  )
}

describe('CredentialDetailPage', () => {
  afterEach(() => {
    setEncryptionKey(null)
    useAuthStore.setState({ user: null, isAuthenticated: false, isSessionLoading: false })
  })

  it('shows the unlock prompt when the vault is locked', () => {
    renderPage()

    expect(screen.getByText('Your vault is sealed')).toBeInTheDocument()
    expect(screen.queryByText('user@example.com')).not.toBeInTheDocument()
  })

  it('shows a loading state, then the credential detail once the vault is unlocked', async () => {
    server.use(http.get(`${API_BASE_URL}/credentials/:id`, () => HttpResponse.json({ success: true, data: CREDENTIAL, meta: null })))
    setEncryptionKey(await deriveEncryptionKey('unlock-pass', 'user-1'))

    renderPage()

    expect(await screen.findByRole('heading', { name: 'Gmail' })).toBeInTheDocument()
    expect(screen.getByText('user@example.com')).toBeInTheDocument()
  })

  it('unlocks via the prompt and then loads the credential', async () => {
    server.use(http.get(`${API_BASE_URL}/credentials/:id`, () => HttpResponse.json({ success: true, data: CREDENTIAL, meta: null })))

    renderPage()
    await userEvent.type(screen.getByLabelText('Password'), 'unlock-password')
    await userEvent.click(screen.getByRole('button', { name: 'Unlock vault' }))

    expect(await screen.findByRole('heading', { name: 'Gmail' })).toBeInTheDocument()
  })

  it('shows a not-found message when the credential fails to load (e.g. 404)', async () => {
    server.use(
      http.get(`${API_BASE_URL}/credentials/:id`, () =>
        HttpResponse.json({ success: false, error: { code: 'CREDENTIAL_001', message: 'Credential not found', details: null } }, { status: 404 }),
      ),
    )
    setEncryptionKey(await deriveEncryptionKey('unlock-pass', 'user-1'))

    renderPage('missing')

    expect(await screen.findByText('Credential not found.')).toBeInTheDocument()
  })
})
