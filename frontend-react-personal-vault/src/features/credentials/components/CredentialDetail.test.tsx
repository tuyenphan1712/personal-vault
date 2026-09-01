import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Credential } from '../types/credential.types'
import { CredentialDetail } from './CredentialDetail'

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

describe('CredentialDetail', () => {
  it('renders the platform name, account, note, masked password, and last-updated date', () => {
    render(<CredentialDetail credential={CREDENTIAL} onUnlockNeeded={vi.fn()} onNotify={vi.fn()} />)

    expect(screen.getByRole('heading', { name: 'Gmail' })).toBeInTheDocument()
    expect(screen.getByText('user@example.com')).toBeInTheDocument()
    expect(screen.getByText('Personal account')).toBeInTheDocument()
    expect(screen.getByText('••••••••••••')).toBeInTheDocument()
    expect(screen.getByText(/Last updated/)).toBeInTheDocument()
  })

  it('omits the note paragraph when there is none', () => {
    render(<CredentialDetail credential={{ ...CREDENTIAL, note: null }} onUnlockNeeded={vi.fn()} onNotify={vi.fn()} />)

    expect(screen.queryByText('Personal account')).not.toBeInTheDocument()
  })
})
