import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { encryptValue, deriveEncryptionKey } from '@/shared/lib/crypto'
import { setEncryptionKey } from '@/shared/lib/keyStore'
import { PasswordReveal } from './PasswordReveal'

const PLAINTEXT_PASSWORD = 'super-secret-plaintext'

describe('PasswordReveal', () => {
  afterEach(() => {
    setEncryptionKey(null)
  })

  it('shows a masked value by default', async () => {
    const key = await deriveEncryptionKey('unlock-pass', 'user-1')
    setEncryptionKey(key)
    const encryptedPassword = await encryptValue(PLAINTEXT_PASSWORD, key)

    render(<PasswordReveal encryptedPassword={encryptedPassword} onUnlockNeeded={vi.fn()} onNotify={vi.fn()} />)

    expect(screen.getByText('••••••••••••')).toBeInTheDocument()
    expect(screen.queryByText(PLAINTEXT_PASSWORD)).not.toBeInTheDocument()
  })

  it('reveals the decrypted plaintext only after clicking "Show password"', async () => {
    const key = await deriveEncryptionKey('unlock-pass', 'user-1')
    setEncryptionKey(key)
    const encryptedPassword = await encryptValue(PLAINTEXT_PASSWORD, key)

    render(<PasswordReveal encryptedPassword={encryptedPassword} onUnlockNeeded={vi.fn()} onNotify={vi.fn()} />)

    expect(screen.queryByText(PLAINTEXT_PASSWORD)).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Show password' }))

    expect(await screen.findByText(PLAINTEXT_PASSWORD)).toBeInTheDocument()
  })

  it('hides the plaintext again after clicking "Hide password"', async () => {
    const key = await deriveEncryptionKey('unlock-pass', 'user-1')
    setEncryptionKey(key)
    const encryptedPassword = await encryptValue(PLAINTEXT_PASSWORD, key)

    render(<PasswordReveal encryptedPassword={encryptedPassword} onUnlockNeeded={vi.fn()} onNotify={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: 'Show password' }))
    await screen.findByText(PLAINTEXT_PASSWORD)

    await userEvent.click(screen.getByRole('button', { name: 'Hide password' }))

    expect(screen.queryByText(PLAINTEXT_PASSWORD)).not.toBeInTheDocument()
    expect(screen.getByText('••••••••••••')).toBeInTheDocument()
  })

  it('shows a "vault locked" message when no encryption key is available', async () => {
    // No key set — simulates a locked vault (e.g. after reload).
    const encryptedPassword = 'aXY=:Y2lwaGVy'
    const onUnlockNeeded = vi.fn()

    render(<PasswordReveal encryptedPassword={encryptedPassword} onUnlockNeeded={onUnlockNeeded} onNotify={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: 'Show password' }))

    expect(await screen.findByText('Vault is locked.')).toBeInTheDocument()
    expect(screen.queryByText(PLAINTEXT_PASSWORD)).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Unlock again' }))
    expect(onUnlockNeeded).toHaveBeenCalledOnce()
  })

  it('shows a decrypt-error message when decryption fails (e.g. wrong key)', async () => {
    // Key that does not match the one used to encrypt this value — AES-GCM auth tag check fails.
    const wrongKey = await deriveEncryptionKey('a-different-password', 'user-1')
    setEncryptionKey(wrongKey)
    const rightKey = await deriveEncryptionKey('unlock-pass', 'user-1')
    const encryptedPassword = await encryptValue(PLAINTEXT_PASSWORD, rightKey)

    render(<PasswordReveal encryptedPassword={encryptedPassword} onUnlockNeeded={vi.fn()} onNotify={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: 'Show password' }))

    expect(await screen.findByText('Could not decrypt — try unlocking the vault again.')).toBeInTheDocument()
  })

  it('re-hides a revealed password when the encrypted value changes (e.g. after an edit)', async () => {
    const key = await deriveEncryptionKey('unlock-pass', 'user-1')
    setEncryptionKey(key)
    const encryptedPassword = await encryptValue(PLAINTEXT_PASSWORD, key)
    const newEncryptedPassword = await encryptValue('a-new-password', key)

    const { rerender } = render(<PasswordReveal encryptedPassword={encryptedPassword} onUnlockNeeded={vi.fn()} onNotify={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Show password' }))
    await screen.findByText(PLAINTEXT_PASSWORD)

    rerender(<PasswordReveal encryptedPassword={newEncryptedPassword} onUnlockNeeded={vi.fn()} onNotify={vi.fn()} />)

    expect(screen.queryByText(PLAINTEXT_PASSWORD)).not.toBeInTheDocument()
    expect(screen.getByText('••••••••••••')).toBeInTheDocument()
  })

  it('copies the revealed password to the clipboard and notifies, without ever logging it', async () => {
    const key = await deriveEncryptionKey('unlock-pass', 'user-1')
    setEncryptionKey(key)
    const encryptedPassword = await encryptValue(PLAINTEXT_PASSWORD, key)
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const onNotify = vi.fn()

    render(<PasswordReveal encryptedPassword={encryptedPassword} onUnlockNeeded={vi.fn()} onNotify={onNotify} />)
    await userEvent.click(screen.getByRole('button', { name: 'Show password' }))
    await screen.findByText(PLAINTEXT_PASSWORD)

    await userEvent.click(screen.getByRole('button', { name: 'Copy password' }))

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(PLAINTEXT_PASSWORD))
    expect(onNotify).toHaveBeenCalledWith('Password copied. Clipboard clears in 20s.')
    for (const call of logSpy.mock.calls) {
      expect(JSON.stringify(call)).not.toContain(PLAINTEXT_PASSWORD)
    }
    logSpy.mockRestore()
  })
})
