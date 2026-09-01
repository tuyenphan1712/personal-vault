import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/features/auth'
import { getEncryptionKey, setEncryptionKey } from '@/shared/lib/keyStore'
import { UnlockVaultPrompt } from './UnlockVaultPrompt'

describe('UnlockVaultPrompt', () => {
  afterEach(() => {
    setEncryptionKey(null)
    useAuthStore.setState({ user: null, isAuthenticated: false, isSessionLoading: false })
  })

  it('renders the unlock title and password field', () => {
    render(<UnlockVaultPrompt onUnlocked={vi.fn()} />)

    expect(screen.getByText('Your vault is sealed')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Unlock vault' })).toBeInTheDocument()
  })

  it('shows a validation error when the password is empty', async () => {
    render(<UnlockVaultPrompt onUnlocked={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: 'Unlock vault' }))

    expect(await screen.findByText('Password is required')).toBeInTheDocument()
  })

  it('derives the encryption key from the typed password and calls onUnlocked', async () => {
    useAuthStore.setState({
      user: { id: 'user-1', phone: '0900000000', fullName: 'Jane Doe', role: 'member' },
      isAuthenticated: true,
      isSessionLoading: false,
    })
    const onUnlocked = vi.fn()

    render(<UnlockVaultPrompt onUnlocked={onUnlocked} />)

    expect(getEncryptionKey()).toBeNull()
    await userEvent.type(screen.getByLabelText('Password'), 'my-unlock-password')
    await userEvent.click(screen.getByRole('button', { name: 'Unlock vault' }))

    await waitFor(() => expect(onUnlocked).toHaveBeenCalledOnce())
    expect(getEncryptionKey()).not.toBeNull()
  })
})
