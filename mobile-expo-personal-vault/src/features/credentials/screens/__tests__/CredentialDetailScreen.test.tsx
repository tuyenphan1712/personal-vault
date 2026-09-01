import { QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { rest } from 'msw'
import { Alert } from 'react-native'
import { API_BASE_URL } from '@/src/config/constants'
import { server } from '@/src/shared/testing/msw/server'
import { createTestQueryClient } from '@/src/shared/testing/queryClient'
import { setEncryptionKey } from '@/src/shared/lib/crypto/keyStore'
import { deriveEncryptionKey, encryptCredential } from '@/src/shared/lib/crypto/cryptoAdapter'
import { CredentialDetailScreen } from '../CredentialDetailScreen'
import {
  credentialFixture,
  deleteCredentialSuccessHandler,
  getCredentialSuccessHandler,
} from '../../hooks/__tests__/mocks/credentialHandlers'

const mockBack = jest.fn()
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack, push: jest.fn() }) }))

function renderScreen(credentialId: string) {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <CredentialDetailScreen credentialId={credentialId} />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('CredentialDetailScreen', () => {
  it('shows an invalid-credential message for an empty route param instead of calling the API', async () => {
    await renderScreen('')

    expect(screen.getByText('Invalid credential.')).toBeTruthy()
  })

  it('shows the unlock prompt when the key is missing, then reveals the password once unlocked', async () => {
    setEncryptionKey(null)
    server.use(getCredentialSuccessHandler)
    await renderScreen('cred-1')

    expect(await screen.findByText('Vault locked')).toBeTruthy()
  })

  it('reveals the correct plaintext password when unlocked with the matching key', async () => {
    const key = await deriveEncryptionKey('hunter2', 'user-1')
    const encryptedPassword = await encryptCredential('the-real-password', key)
    setEncryptionKey(key)
    server.use(
      rest.get(`${API_BASE_URL}/credentials/:id`, (_req, res, ctx) =>
        res(ctx.status(200), ctx.json({ success: true, data: { ...credentialFixture, encryptedPassword }, meta: null })),
      ),
    )
    await renderScreen('cred-1')

    await screen.findByText(credentialFixture.platformName)
    await fireEvent.press(screen.getByRole('button', { name: 'Show' }))

    expect(await screen.findByText('the-real-password')).toBeTruthy()
  })

  it('deletes the credential after confirming and navigates back', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      const deleteButton = buttons?.find((button) => button.text === 'Delete')
      deleteButton?.onPress?.()
    })
    setEncryptionKey(new Uint8Array(32))
    server.use(getCredentialSuccessHandler, deleteCredentialSuccessHandler)
    await renderScreen('cred-1')

    await screen.findByText(credentialFixture.platformName)
    await fireEvent.press(screen.getByRole('button', { name: 'Delete' }))

    expect(alertSpy).toHaveBeenCalled()
    await waitFor(() => expect(mockBack).toHaveBeenCalled())

    alertSpy.mockRestore()
  })
})
