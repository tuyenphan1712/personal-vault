import { fireEvent, screen } from '@testing-library/react-native'
import { renderWithProviders } from '@/src/shared/testing/renderWithProviders'
import { CredentialCard } from '../CredentialCard'
import { credentialFixture } from '../../hooks/__tests__/mocks/credentialHandlers'

describe('CredentialCard', () => {
  it('renders the platform name and account', async () => {
    await renderWithProviders(<CredentialCard credential={credentialFixture} onPress={jest.fn()} />)

    expect(screen.getByText('Gmail')).toBeTruthy()
    expect(screen.getByText('user@gmail.com')).toBeTruthy()
  })

  it('never renders the encrypted password value', async () => {
    await renderWithProviders(<CredentialCard credential={credentialFixture} onPress={jest.fn()} />)

    expect(screen.queryByText(credentialFixture.encryptedPassword)).toBeNull()
  })

  it('calls onPress with the credential id when tapped', async () => {
    const onPress = jest.fn()
    await renderWithProviders(<CredentialCard credential={credentialFixture} onPress={onPress} />)

    await fireEvent.press(screen.getByRole('button'))

    expect(onPress).toHaveBeenCalledWith(credentialFixture.id)
  })
})
