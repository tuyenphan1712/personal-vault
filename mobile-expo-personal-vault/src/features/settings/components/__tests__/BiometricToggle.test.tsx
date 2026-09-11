import { act, fireEvent, screen, waitFor } from '@testing-library/react-native'
import { renderWithProviders } from '@/src/shared/testing/renderWithProviders'
import { useAuthStore } from '@/src/features/auth/stores/auth.store'
import { getBiometricAvailability } from '@/src/shared/lib/auth/biometricAdapter'
import { clearBiometricCredential, saveBiometricCredential } from '@/src/shared/lib/auth/biometricCredentialStore'
import { useBiometricStore } from '../../stores/biometric.store'
import { BiometricToggle } from '../BiometricToggle'

jest.mock('@/src/shared/lib/auth/biometricAdapter', () => ({
  getBiometricAvailability: jest.fn(),
}))
jest.mock('@/src/shared/lib/auth/biometricCredentialStore', () => ({
  saveBiometricCredential: jest.fn().mockResolvedValue(undefined),
  clearBiometricCredential: jest.fn().mockResolvedValue(undefined),
}))

const mockGetBiometricAvailability = getBiometricAvailability as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  useBiometricStore.setState({ enabled: false })
  useAuthStore.setState({
    user: { id: 'user-1', phone: '0900000000', fullName: 'Test User', role: 'member' },
    isAuthenticated: true,
    isSessionLoading: false,
    isAppLocked: false,
  })
})

describe('BiometricToggle', () => {
  it('renders nothing while the availability check is pending', async () => {
    mockGetBiometricAvailability.mockReturnValue(new Promise(() => {}))
    await renderWithProviders(<BiometricToggle />)

    expect(screen.queryByRole('switch')).toBeNull()
  })

  it('renders nothing when the device has no biometric hardware', async () => {
    mockGetBiometricAvailability.mockResolvedValue('no-hardware')
    await renderWithProviders(<BiometricToggle />)

    await waitFor(() => expect(mockGetBiometricAvailability).toHaveBeenCalled())
    expect(screen.queryByRole('switch')).toBeNull()
  })

  it('renders nothing when hardware exists but nothing is enrolled', async () => {
    mockGetBiometricAvailability.mockResolvedValue('not-enrolled')
    await renderWithProviders(<BiometricToggle />)

    await waitFor(() => expect(mockGetBiometricAvailability).toHaveBeenCalled())
    expect(screen.queryByRole('switch')).toBeNull()
  })

  it('renders the toggle, off, when biometrics are available', async () => {
    mockGetBiometricAvailability.mockResolvedValue('available')
    await renderWithProviders(<BiometricToggle />)

    expect(await screen.findByRole('switch')).toBeTruthy()
    expect(screen.getByRole('switch').props.value).toBe(false)
  })

  it('opens a password confirmation modal when turning the toggle on, and saves the wrapped credential on confirm', async () => {
    mockGetBiometricAvailability.mockResolvedValue('available')
    await renderWithProviders(<BiometricToggle />)
    const toggle = await screen.findByRole('switch')
    await act(async () => {
      fireEvent(toggle, 'valueChange', true)
    })

    const passwordField = await screen.findByLabelText('Password')
    await act(async () => {
      fireEvent.changeText(passwordField, 'my-current-password')
    })
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Enable' }))
    })

    expect(saveBiometricCredential).toHaveBeenCalledWith({ phone: '0900000000', password: 'my-current-password' })
    await waitFor(() => expect(useBiometricStore.getState().enabled).toBe(true))
    expect(screen.queryByLabelText('Password')).toBeNull()
  })

  it('cancelling the confirmation modal leaves biometric login disabled', async () => {
    mockGetBiometricAvailability.mockResolvedValue('available')
    await renderWithProviders(<BiometricToggle />)
    const toggle = await screen.findByRole('switch')
    await act(async () => {
      fireEvent(toggle, 'valueChange', true)
    })

    const cancelButton = await screen.findByRole('button', { name: 'Cancel' })
    await act(async () => {
      fireEvent.press(cancelButton)
    })

    expect(saveBiometricCredential).not.toHaveBeenCalled()
    expect(useBiometricStore.getState().enabled).toBe(false)
    expect(screen.queryByLabelText('Password')).toBeNull()
  })

  it('turning the toggle off clears the wrapped credential immediately, with no confirmation step', async () => {
    useBiometricStore.setState({ enabled: true })
    mockGetBiometricAvailability.mockResolvedValue('available')
    await renderWithProviders(<BiometricToggle />)
    const toggle = await screen.findByRole('switch')

    await act(async () => {
      fireEvent(toggle, 'valueChange', false)
    })

    await waitFor(() => expect(clearBiometricCredential).toHaveBeenCalled())
    expect(useBiometricStore.getState().enabled).toBe(false)
    expect(screen.queryByLabelText('Password')).toBeNull()
  })
})
