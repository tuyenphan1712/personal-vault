import { render, screen } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { createQueryClientWrapper } from '@/test/QueryClientWrapper'
import { server } from '@/test/msw/server'
import type { Credential } from '../types/credential.types'
import { CredentialList } from './CredentialList'

const CREDENTIALS: Credential[] = [
  { id: 'c1', platformName: 'Gmail', account: 'user@example.com', encryptedPassword: 'aXY=:Y2lwaGVy', ciphertextVersion: 1, note: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'c2', platformName: 'Facebook', account: 'user2@example.com', encryptedPassword: 'aXY=:Y2lwaGVy2', ciphertextVersion: 1, note: null, createdAt: '2026-01-02T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z' },
]

function mockCredentialsEndpoint(handler: Parameters<typeof http.get>[1]) {
  server.use(http.get(`${API_BASE_URL}/credentials`, handler))
}

function renderList() {
  const Wrapper = createQueryClientWrapper()
  return render(
    <Wrapper>
      <CredentialList onEdit={vi.fn()} onUnlockNeeded={vi.fn()} onNotify={vi.fn()} />
    </Wrapper>,
  )
}

describe('CredentialList', () => {
  it('renders a loading state', () => {
    mockCredentialsEndpoint(() => new Promise(() => {}))

    renderList()

    expect(screen.getByText('Loading credentials…')).toBeInTheDocument()
  })

  it('renders an error state when the request fails', async () => {
    mockCredentialsEndpoint(() =>
      HttpResponse.json({ success: false, error: { code: 'AUTH_005', message: 'Unauthorized', details: null } }, { status: 401 }),
    )

    renderList()

    expect(await screen.findByText("Couldn't load your credentials. Try again.")).toBeInTheDocument()
  })

  it('renders an empty state when there are no credentials', async () => {
    mockCredentialsEndpoint(() =>
      HttpResponse.json({ success: true, data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } }),
    )

    renderList()

    expect(await screen.findByText('No credentials yet')).toBeInTheDocument()
  })

  it('renders the list of credentials with a count and the encrypted badge', async () => {
    mockCredentialsEndpoint(() =>
      HttpResponse.json({ success: true, data: CREDENTIALS, meta: { page: 1, limit: 20, total: 2, totalPages: 1 } }),
    )

    renderList()

    expect(await screen.findByText('Gmail')).toBeInTheDocument()
    expect(screen.getByText('Facebook')).toBeInTheDocument()
    expect(screen.getByText('2 credentials')).toBeInTheDocument()
    expect(screen.getByText('Encrypted')).toBeInTheDocument()
  })

  it('renders the singular count label for exactly one credential', async () => {
    mockCredentialsEndpoint(() =>
      HttpResponse.json({ success: true, data: [CREDENTIALS[0]], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } }),
    )

    renderList()

    expect(await screen.findByText('1 credential')).toBeInTheDocument()
  })
})
