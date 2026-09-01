import { QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { rest } from 'msw'
import { API_BASE_URL } from '@/src/config/constants'
import { server } from '@/src/shared/testing/msw/server'
import { createTestQueryClient } from '@/src/shared/testing/queryClient'
import { setEncryptionKey } from '@/src/shared/lib/crypto/keyStore'
import { CredentialFormScreen } from '../CredentialFormScreen'
import {
  credentialFixture,
  getCredentialSuccessHandler,
  updateCredentialSuccessHandler,
} from '../../hooks/__tests__/mocks/credentialHandlers'

const mockBack = jest.fn()
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack }) }))

function renderScreen(credentialId?: string) {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <CredentialFormScreen credentialId={credentialId} />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  setEncryptionKey(new Uint8Array(32).fill(7))
})

describe('CredentialFormScreen', () => {
  it('encrypts the password before sending it to the server on create', async () => {
    let capturedBody: { encryptedPassword?: string; platformName?: string } | undefined
    server.use(
      rest.post(`${API_BASE_URL}/credentials`, async (req, res, ctx) => {
        capturedBody = await req.json()
        return res(ctx.status(201), ctx.json({ success: true, data: { ...credentialFixture, ...capturedBody }, meta: null }))
      }),
    )

    await renderScreen()

    await fireEvent.changeText(screen.getByLabelText('Platform'), 'Gmail')
    await fireEvent.changeText(screen.getByLabelText('Account'), 'user@gmail.com')
    await fireEvent.changeText(screen.getByLabelText('Password'), 'plaintext-password-123')
    await fireEvent.press(screen.getByRole('button', { name: 'Add credential' }))

    await waitFor(() => expect(mockBack).toHaveBeenCalled())

    expect(capturedBody?.encryptedPassword).toBeDefined()
    expect(capturedBody?.encryptedPassword).not.toContain('plaintext-password-123')
    expect(capturedBody?.encryptedPassword).toMatch(/^[A-Za-z0-9+/]+=*:[A-Za-z0-9+/]+=*$/)
  })

  it('loads the existing credential and submits an update when editing', async () => {
    server.use(getCredentialSuccessHandler, updateCredentialSuccessHandler)
    await renderScreen('cred-1')

    expect(await screen.findByDisplayValue('Gmail')).toBeTruthy()
    expect(screen.getByText('Save changes')).toBeTruthy()

    await fireEvent.changeText(screen.getByLabelText('Password'), 'new-password')
    await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(mockBack).toHaveBeenCalled())
  })
})
