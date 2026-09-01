import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { PasswordReveal } from '../PasswordReveal'

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/src/shared/lib/crypto/keyStore', () => ({
  getEncryptionKey: jest.fn(),
}))

jest.mock('@/src/shared/lib/crypto/cryptoAdapter', () => ({
  decryptCredential: jest.fn(),
}))

import * as Clipboard from 'expo-clipboard'
import { decryptCredential } from '@/src/shared/lib/crypto/cryptoAdapter'
import { getEncryptionKey } from '@/src/shared/lib/crypto/keyStore'

const ENCRYPTED = 'AAAAAAAAAAAAAAAA:ZmFrZS1jaXBoZXJ0ZXh0'

beforeEach(() => {
  jest.clearAllMocks()
})

describe('PasswordReveal', () => {
  it('hides the password by default', async () => {
    ;(getEncryptionKey as jest.Mock).mockReturnValue(new Uint8Array(32))
    await render(<PasswordReveal encryptedPassword={ENCRYPTED} onUnlockNeeded={jest.fn()} onCopied={jest.fn()} />)

    expect(screen.getByText('••••••••••••')).toBeTruthy()
    expect(decryptCredential).not.toHaveBeenCalled()
  })

  it('decrypts and shows the plaintext when "Show" is pressed', async () => {
    ;(getEncryptionKey as jest.Mock).mockReturnValue(new Uint8Array(32))
    ;(decryptCredential as jest.Mock).mockResolvedValue('my-secret-password')
    await render(<PasswordReveal encryptedPassword={ENCRYPTED} onUnlockNeeded={jest.fn()} onCopied={jest.fn()} />)

    await fireEvent.press(screen.getByRole('button', { name: 'Show' }))

    expect(await screen.findByText('my-secret-password')).toBeTruthy()
  })

  it('prompts to unlock the vault when the encryption key is missing', async () => {
    ;(getEncryptionKey as jest.Mock).mockReturnValue(null)
    const onUnlockNeeded = jest.fn()
    await render(<PasswordReveal encryptedPassword={ENCRYPTED} onUnlockNeeded={onUnlockNeeded} onCopied={jest.fn()} />)

    await fireEvent.press(screen.getByRole('button', { name: 'Show' }))

    expect(await screen.findByText('Vault is locked')).toBeTruthy()
    expect(decryptCredential).not.toHaveBeenCalled()
  })

  it('shows a decrypt error message when decryption throws (e.g. wrong key)', async () => {
    ;(getEncryptionKey as jest.Mock).mockReturnValue(new Uint8Array(32))
    ;(decryptCredential as jest.Mock).mockRejectedValue(new Error('bad auth tag'))
    await render(<PasswordReveal encryptedPassword={ENCRYPTED} onUnlockNeeded={jest.fn()} onCopied={jest.fn()} />)

    await fireEvent.press(screen.getByRole('button', { name: 'Show' }))

    expect(await screen.findByText('Could not decrypt this password')).toBeTruthy()
  })

  it('copies the revealed password to the clipboard and notifies the caller', async () => {
    ;(getEncryptionKey as jest.Mock).mockReturnValue(new Uint8Array(32))
    ;(decryptCredential as jest.Mock).mockResolvedValue('my-secret-password')
    const onCopied = jest.fn()
    await render(<PasswordReveal encryptedPassword={ENCRYPTED} onUnlockNeeded={jest.fn()} onCopied={onCopied} />)

    await fireEvent.press(screen.getByRole('button', { name: 'Show' }))
    await screen.findByText('my-secret-password')
    await fireEvent.press(screen.getByRole('button', { name: 'Copy' }))

    await waitFor(() => expect(onCopied).toHaveBeenCalled())
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('my-secret-password')
  })
})
