import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { createQueryClientWrapper } from '@/test/QueryClientWrapper'
import { server } from '@/test/msw/server'
import type { Credential } from '../types/credential.types'
import { CredentialCard } from './CredentialCard'

const CREDENTIAL: Credential = {
  id: 'c1',
  platformName: 'Gmail',
  account: 'user@example.com',
  encryptedPassword: 'aXY=:Y2lwaGVy',
  ciphertextVersion: 1,
  note: 'Personal account',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

function renderCard(props: Partial<ComponentProps<typeof CredentialCard>> = {}) {
  const Wrapper = createQueryClientWrapper()
  return render(
    <Wrapper>
      <ul>
        <CredentialCard credential={CREDENTIAL} onEdit={vi.fn()} onUnlockNeeded={vi.fn()} onNotify={vi.fn()} {...props} />
      </ul>
    </Wrapper>,
  )
}

describe('CredentialCard', () => {
  it('renders the platform name, account, and note', () => {
    renderCard()

    expect(screen.getByText('Gmail')).toBeInTheDocument()
    expect(screen.getByText('user@example.com')).toBeInTheDocument()
    expect(screen.getByText('Personal account')).toBeInTheDocument()
  })

  it('omits the note paragraph when there is none', () => {
    renderCard({ credential: { ...CREDENTIAL, note: null } })

    expect(screen.queryByText('Personal account')).not.toBeInTheDocument()
  })

  it('calls onEdit with the credential when Edit is clicked', async () => {
    const onEdit = vi.fn()
    renderCard({ onEdit })

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }))

    expect(onEdit).toHaveBeenCalledWith(CREDENTIAL)
  })

  it('deletes the credential and notifies on success when Delete is clicked', async () => {
    let deleteCalled = false
    server.use(
      http.delete(`${API_BASE_URL}/credentials/:id`, ({ params }) => {
        deleteCalled = true
        expect(params.id).toBe('c1')
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const onNotify = vi.fn()
    renderCard({ onNotify })

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(deleteCalled).toBe(true))
    expect(onNotify).toHaveBeenCalledWith('Gmail deleted.')
  })
})
