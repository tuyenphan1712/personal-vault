import { screen } from '@testing-library/react-native'
import { renderWithProviders } from '@/src/shared/testing/renderWithProviders'
import { SettingsScreen } from '../SettingsScreen'

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn() }),
}))

describe('SettingsScreen', () => {
  it('renders the header, appearance section, and language section', async () => {
    await renderWithProviders(<SettingsScreen />)

    expect(screen.getByText('Settings')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Go back' })).toBeTruthy()
    expect(screen.getByText('Appearance')).toBeTruthy()
    expect(screen.getByText('Language')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Dark' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Display language' })).toBeTruthy()
  })
})
