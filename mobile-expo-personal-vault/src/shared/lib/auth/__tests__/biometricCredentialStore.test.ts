import * as SecureStore from 'expo-secure-store'
import { clearBiometricCredential, readBiometricCredential, saveBiometricCredential } from '../biometricCredentialStore'

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}))

const mockGetItemAsync = SecureStore.getItemAsync as jest.Mock
const mockSetItemAsync = SecureStore.setItemAsync as jest.Mock
const mockDeleteItemAsync = SecureStore.deleteItemAsync as jest.Mock

const KEY = 'auth.biometricCredential'

beforeEach(() => {
  jest.clearAllMocks()
})

describe('saveBiometricCredential', () => {
  it('writes the phone and password to SecureStore with requireAuthentication enabled', async () => {
    await saveBiometricCredential({ phone: '0900000000', password: 'my-password' })

    expect(mockSetItemAsync).toHaveBeenCalledWith(
      KEY,
      JSON.stringify({ phone: '0900000000', password: 'my-password' }),
      expect.objectContaining({ requireAuthentication: true }),
    )
  })
})

describe('readBiometricCredential', () => {
  it('reads and parses the stored credential, requiring authentication', async () => {
    mockGetItemAsync.mockResolvedValue(JSON.stringify({ phone: '0900000000', password: 'my-password' }))

    const result = await readBiometricCredential()

    expect(result).toEqual({ phone: '0900000000', password: 'my-password' })
    expect(mockGetItemAsync).toHaveBeenCalledWith(KEY, expect.objectContaining({ requireAuthentication: true }))
  })

  it('returns null when nothing is stored', async () => {
    mockGetItemAsync.mockResolvedValue(null)

    expect(await readBiometricCredential()).toBeNull()
  })

  it('propagates a rejection (e.g. cancelled or failed biometric prompt)', async () => {
    mockGetItemAsync.mockRejectedValue(new Error('UserCancel'))

    await expect(readBiometricCredential()).rejects.toThrow('UserCancel')
  })
})

describe('clearBiometricCredential', () => {
  it('deletes the stored item', async () => {
    await clearBiometricCredential()

    expect(mockDeleteItemAsync).toHaveBeenCalledWith(KEY)
  })
})
