import { act, fireEvent, screen, waitFor } from '@testing-library/react-native'
import { renderWithProviders } from '@/src/shared/testing/renderWithProviders'
import { useAuthStore } from '@/src/features/auth/stores/auth.store'
import { useBiometricStore } from '@/src/features/settings/stores/biometric.store'
import { getBiometricAvailability } from '@/src/shared/lib/auth/biometricAdapter'
import { readBiometricCredential } from '@/src/shared/lib/auth/biometricCredentialStore'
import { deriveEncryptionKey } from '@/src/shared/lib/crypto/cryptoAdapter'
import { getEncryptionKey, setEncryptionKey } from '@/src/shared/lib/crypto/keyStore'
import { UnlockVaultPrompt } from '../UnlockVaultPrompt'

jest.mock('@/src/shared/lib/auth/biometricAdapter', () => ({
  getBiometricAvailability: jest.fn().mockResolvedValue('no-hardware'),
}))
jest.mock('@/src/shared/lib/auth/biometricCredentialStore', () => ({
  readBiometricCredential: jest.fn(),
}))

const mockGetBiometricAvailability = getBiometricAvailability as jest.Mock
const mockReadBiometricCredential = readBiometricCredential as jest.Mock

const USER_ID = 'user-1'

beforeEach(() => {
  jest.clearAllMocks()
  mockGetBiometricAvailability.mockResolvedValue('no-hardware')
  useBiometricStore.setState({ enabled: false })
  useAuthStore.setState({
    user: { id: USER_ID, phone: '0900000000', fullName: 'Test User', role: 'member' },
    isAuthenticated: true,
    isSessionLoading: false,
    isAppLocked: false,
  })
  setEncryptionKey(null)
})

describe('UnlockVaultPrompt', () => {
  it('is hidden when biometric login is disabled', async () => {
    useBiometricStore.setState({ enabled: false })
    mockGetBiometricAvailability.mockResolvedValue('available')
    await renderWithProviders(<UnlockVaultPrompt onUnlocked={jest.fn()} />)

    await waitFor(() => expect(mockGetBiometricAvailability).toHaveBeenCalled())
    expect(screen.queryByRole('button', { name: 'Unlock with biometrics' })).toBeNull()
  })

  it('is hidden when biometric login is enabled but the device is no longer capable', async () => {
    useBiometricStore.setState({ enabled: true })
    mockGetBiometricAvailability.mockResolvedValue('not-enrolled')
    await renderWithProviders(<UnlockVaultPrompt onUnlocked={jest.fn()} />)

    await waitFor(() => expect(mockGetBiometricAvailability).toHaveBeenCalled())
    expect(screen.queryByRole('button', { name: 'Unlock with biometrics' })).toBeNull()
  })

  it('unlocks the vault with the wrapped password when the biometric button is pressed', async () => {
    useBiometricStore.setState({ enabled: true })
    mockGetBiometricAvailability.mockResolvedValue('available')
    mockReadBiometricCredential.mockResolvedValue({ phone: '0900000000', password: 'my-password' })
    const onUnlocked = jest.fn()
    await renderWithProviders(<UnlockVaultPrompt onUnlocked={onUnlocked} />)

    const biometricButton = await screen.findByRole('button', { name: 'Unlock with biometrics' })
    await act(async () => {
      fireEvent.press(biometricButton)
    })

    await waitFor(() => expect(getEncryptionKey()).not.toBeNull())
    const expectedKey = await deriveEncryptionKey('my-password', USER_ID)
    expect(getEncryptionKey()).toEqual(expectedKey)
    expect(onUnlocked).toHaveBeenCalled()
  })

  it('shows a non-blocking error and leaves the password field usable when the biometric prompt fails or is cancelled', async () => {
    useBiometricStore.setState({ enabled: true })
    mockGetBiometricAvailability.mockResolvedValue('available')
    mockReadBiometricCredential.mockRejectedValue(new Error('UserCancel'))
    const onUnlocked = jest.fn()
    await renderWithProviders(<UnlockVaultPrompt onUnlocked={onUnlocked} />)

    const biometricButton = await screen.findByRole('button', { name: 'Unlock with biometrics' })
    await act(async () => {
      fireEvent.press(biometricButton)
    })

    expect(await screen.findByText('Could not verify your biometrics. Try again or unlock with your password.')).toBeTruthy()
    expect(onUnlocked).not.toHaveBeenCalled()
    expect(getEncryptionKey()).toBeNull()
    expect(screen.getByLabelText('Password')).toBeTruthy()
  })
})
