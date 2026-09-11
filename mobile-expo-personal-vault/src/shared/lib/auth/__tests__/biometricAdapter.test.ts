import * as LocalAuthentication from 'expo-local-authentication'
import { getBiometricAvailability } from '../biometricAdapter'

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
}))

const mockHasHardwareAsync = LocalAuthentication.hasHardwareAsync as jest.Mock
const mockIsEnrolledAsync = LocalAuthentication.isEnrolledAsync as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
})

describe('getBiometricAvailability', () => {
  it('returns no-hardware when the device has no biometric sensor', async () => {
    mockHasHardwareAsync.mockResolvedValue(false)

    expect(await getBiometricAvailability()).toBe('no-hardware')
  })

  it('does not check enrollment when there is no hardware', async () => {
    mockHasHardwareAsync.mockResolvedValue(false)

    await getBiometricAvailability()

    expect(mockIsEnrolledAsync).not.toHaveBeenCalled()
  })

  it('returns not-enrolled when hardware exists but nothing is enrolled', async () => {
    mockHasHardwareAsync.mockResolvedValue(true)
    mockIsEnrolledAsync.mockResolvedValue(false)

    expect(await getBiometricAvailability()).toBe('not-enrolled')
  })

  it('returns available when hardware exists and biometrics are enrolled', async () => {
    mockHasHardwareAsync.mockResolvedValue(true)
    mockIsEnrolledAsync.mockResolvedValue(true)

    expect(await getBiometricAvailability()).toBe('available')
  })
})
