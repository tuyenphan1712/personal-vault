import { fireEvent, render, screen } from '@testing-library/react-native'
import { CredentialCard } from '../CredentialCard'
import { credentialFixture } from '../../hooks/__tests__/mocks/credentialHandlers'

describe('CredentialCard', () => {
  it('renders the platform name and account', async () => {
    await render(<CredentialCard credential={credentialFixture} onPress={jest.fn()} />)

    expect(screen.getByText('Gmail')).toBeTruthy()
    expect(screen.getByText('user@gmail.com')).toBeTruthy()
  })

  it('never renders the encrypted password value', async () => {
    await render(<CredentialCard credential={credentialFixture} onPress={jest.fn()} />)

    expect(screen.queryByText(credentialFixture.encryptedPassword)).toBeNull()
  })

  it('calls onPress with the credential id when tapped', async () => {
    const onPress = jest.fn()
    await render(<CredentialCard credential={credentialFixture} onPress={onPress} />)

    await fireEvent.press(screen.getByRole('button'))

    expect(onPress).toHaveBeenCalledWith(credentialFixture.id)
  })
})
