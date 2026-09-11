import { screen, waitFor } from '@testing-library/react-native'
import { renderWithProviders } from '@/src/shared/testing/renderWithProviders'
import { getBiometricAvailability } from '@/src/shared/lib/auth/biometricAdapter'
import { SettingsScreen } from '../SettingsScreen'

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn() }),
}))
jest.mock('@/src/shared/lib/auth/biometricAdapter', () => ({
  getBiometricAvailability: jest.fn().mockResolvedValue('available'),
}))

describe('SettingsScreen', () => {
  it('renders the header, appearance, language, and security sections', async () => {
    await renderWithProviders(<SettingsScreen />)

    expect(screen.getByText('Settings')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Go back' })).toBeTruthy()
    expect(screen.getByText('Appearance')).toBeTruthy()
    expect(screen.getByText('Language')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Dark' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Display language' })).toBeTruthy()
    expect(screen.getByText('Security')).toBeTruthy()
    await waitFor(() => expect(getBiometricAvailability).toHaveBeenCalled())
    expect(await screen.findByRole('switch')).toBeTruthy()
  })
})
