import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react-native'
import { server } from '@/src/shared/testing/msw/server'
import { createTestQueryClient } from '@/src/shared/testing/queryClient'
import { setEncryptionKey } from '@/src/shared/lib/crypto/keyStore'
import { CredentialListScreen } from '../CredentialListScreen'
import {
  listCredentialsEmptyHandler,
  listCredentialsNetworkErrorHandler,
  listCredentialsSuccessHandler,
} from '../../hooks/__tests__/mocks/credentialHandlers'

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }))

function renderScreen() {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <CredentialListScreen />
    </QueryClientProvider>,
  )
}

describe('CredentialListScreen', () => {
  it('shows the unlock-vault prompt instead of data when the key is missing', async () => {
    setEncryptionKey(null)
    server.use(listCredentialsSuccessHandler)
    await renderScreen()

    expect(screen.getByText('Vault locked')).toBeTruthy()
    expect(screen.queryByText('Gmail')).toBeNull()
  })

  it('fetches and displays credentials once unlocked', async () => {
    setEncryptionKey(new Uint8Array(32))
    server.use(listCredentialsSuccessHandler)
    await renderScreen()

    expect(await screen.findByText('Gmail')).toBeTruthy()
    expect(screen.getByText('user@gmail.com')).toBeTruthy()
  })

  it('shows an empty state when there are no credentials', async () => {
    setEncryptionKey(new Uint8Array(32))
    server.use(listCredentialsEmptyHandler)
    await renderScreen()

    expect(await screen.findByText('No credentials saved yet.')).toBeTruthy()
  })

  it('shows an offline-friendly message on a network error', async () => {
    setEncryptionKey(new Uint8Array(32))
    server.use(listCredentialsNetworkErrorHandler)
    await renderScreen()

    await waitFor(() => expect(screen.getByText(/offline/i)).toBeTruthy())
  })
})
