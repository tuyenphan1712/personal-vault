import { act, fireEvent, screen, waitFor } from '@testing-library/react-native'
import { renderWithProviders } from '@/src/shared/testing/renderWithProviders'
import { getBiometricAvailability } from '@/src/shared/lib/auth/biometricAdapter'
import { readBiometricCredential } from '@/src/shared/lib/auth/biometricCredentialStore'
import { useBiometricStore } from '@/src/features/settings/stores/biometric.store'
import { useLastAccountStore } from '../../stores/lastAccount.store'
import { LoginForm } from '../LoginForm'

jest.mock('@/src/shared/lib/auth/biometricAdapter', () => ({
  getBiometricAvailability: jest.fn().mockResolvedValue('no-hardware'),
}))
jest.mock('@/src/shared/lib/auth/biometricCredentialStore', () => ({
  readBiometricCredential: jest.fn(),
}))

const mockGetBiometricAvailability = getBiometricAvailability as jest.Mock
const mockReadBiometricCredential = readBiometricCredential as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  mockGetBiometricAvailability.mockResolvedValue('no-hardware')
  useBiometricStore.setState({ enabled: false })
  useLastAccountStore.setState({ phone: null, hasHydrated: true })
})

describe('LoginForm', () => {
  it('renders the phone and password fields', async () => {
    await renderWithProviders(<LoginForm onSubmit={jest.fn()} isSubmitting={false} errorMessage={null} />)

    expect(screen.getByLabelText('Phone number')).toBeTruthy()
    expect(screen.getByLabelText('Password')).toBeTruthy()
  })

  it('shows validation errors and does not submit when fields are invalid', async () => {
    const onSubmit = jest.fn()
    await renderWithProviders(<LoginForm onSubmit={onSubmit} isSubmitting={false} errorMessage={null} />)

    await fireEvent.changeText(screen.getByLabelText('Password'), 'short')
    await fireEvent.press(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByText('Phone number is required')).toBeTruthy()
    expect(await screen.findByText('Password must be at least 8 characters')).toBeTruthy()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('calls onSubmit with the entered values when valid', async () => {
    const onSubmit = jest.fn()
    await renderWithProviders(<LoginForm onSubmit={onSubmit} isSubmitting={false} errorMessage={null} />)

    await fireEvent.changeText(screen.getByLabelText('Phone number'), '0900000000')
    await fireEvent.changeText(screen.getByLabelText('Password'), 'a-strong-password')
    await fireEvent.press(screen.getByRole('button', { name: 'Log in' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onSubmit.mock.calls[0][0]).toEqual({ phone: '0900000000', password: 'a-strong-password' })
  })

  it('shows the server error message when provided', async () => {
    await renderWithProviders(<LoginForm onSubmit={jest.fn()} isSubmitting={false} errorMessage="Invalid phone or password" />)

    expect(screen.getByText('Invalid phone or password')).toBeTruthy()
  })

  it('disables the submit button while submitting', async () => {
    await renderWithProviders(<LoginForm onSubmit={jest.fn()} isSubmitting errorMessage={null} />)

    expect(screen.getByRole('button')).toBeDisabled()
  })

  describe('remembered phone and switch account', () => {
    it('pre-fills the phone field with the remembered phone number', async () => {
      useLastAccountStore.setState({ phone: '0900000000', hasHydrated: true })
      await renderWithProviders(<LoginForm onSubmit={jest.fn()} isSubmitting={false} errorMessage={null} />)

      expect(await screen.findByDisplayValue('0900000000')).toBeTruthy()
    })

    it('does not show the switch-account control when no phone is remembered', async () => {
      await renderWithProviders(<LoginForm onSubmit={jest.fn()} isSubmitting={false} errorMessage={null} />)

      expect(screen.queryByRole('button', { name: 'Switch account' })).toBeNull()
    })

    it('shows switch account when a phone is remembered, and clearing it empties the phone field', async () => {
      useLastAccountStore.setState({ phone: '0900000000', hasHydrated: true })
      await renderWithProviders(<LoginForm onSubmit={jest.fn()} isSubmitting={false} errorMessage={null} />)
      expect(await screen.findByDisplayValue('0900000000')).toBeTruthy()

      await act(async () => {
        fireEvent.press(screen.getByRole('button', { name: 'Switch account' }))
      })

      expect(screen.queryByDisplayValue('0900000000')).toBeNull()
      expect(screen.queryByRole('button', { name: 'Switch account' })).toBeNull()
      expect(useLastAccountStore.getState().phone).toBe('0900000000')
    })
  })

  describe('biometric login button', () => {
    it('is hidden when biometric login is disabled', async () => {
      useBiometricStore.setState({ enabled: false })
      mockGetBiometricAvailability.mockResolvedValue('available')
      await renderWithProviders(<LoginForm onSubmit={jest.fn()} isSubmitting={false} errorMessage={null} />)

      await waitFor(() => expect(mockGetBiometricAvailability).toHaveBeenCalled())
      expect(screen.queryByRole('button', { name: 'Log in with biometrics' })).toBeNull()
    })

    it('is hidden when biometric login is enabled but the device is no longer capable', async () => {
      useBiometricStore.setState({ enabled: true })
      mockGetBiometricAvailability.mockResolvedValue('not-enrolled')
      await renderWithProviders(<LoginForm onSubmit={jest.fn()} isSubmitting={false} errorMessage={null} />)

      await waitFor(() => expect(mockGetBiometricAvailability).toHaveBeenCalled())
      expect(screen.queryByRole('button', { name: 'Log in with biometrics' })).toBeNull()
    })

    it('logs in with the wrapped credential when pressed', async () => {
      useBiometricStore.setState({ enabled: true })
      mockGetBiometricAvailability.mockResolvedValue('available')
      mockReadBiometricCredential.mockResolvedValue({ phone: '0900000000', password: 'my-password' })
      const onSubmit = jest.fn()
      await renderWithProviders(<LoginForm onSubmit={onSubmit} isSubmitting={false} errorMessage={null} />)

      const biometricButton = await screen.findByRole('button', { name: 'Log in with biometrics' })
      await act(async () => {
        fireEvent.press(biometricButton)
      })

      expect(onSubmit).toHaveBeenCalledWith({ phone: '0900000000', password: 'my-password' })
    })

    it('shows a non-blocking error and does not submit when the biometric prompt fails or is cancelled', async () => {
      useBiometricStore.setState({ enabled: true })
      mockGetBiometricAvailability.mockResolvedValue('available')
      mockReadBiometricCredential.mockRejectedValue(new Error('UserCancel'))
      const onSubmit = jest.fn()
      await renderWithProviders(<LoginForm onSubmit={onSubmit} isSubmitting={false} errorMessage={null} />)

      const biometricButton = await screen.findByRole('button', { name: 'Log in with biometrics' })
      await act(async () => {
        fireEvent.press(biometricButton)
      })

      expect(await screen.findByText('Could not verify your biometrics. Try again or log in with your password.')).toBeTruthy()
      expect(onSubmit).not.toHaveBeenCalled()
    })
  })
})
