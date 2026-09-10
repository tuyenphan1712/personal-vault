import { QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, screen, waitFor } from '@testing-library/react-native'
import { renderWithProviders } from '@/src/shared/testing/renderWithProviders'
import { rest } from 'msw'
import { API_BASE_URL } from '@/src/config/constants'
import { server } from '@/src/shared/testing/msw/server'
import { createTestQueryClient } from '@/src/shared/testing/queryClient'
import { setEncryptionKey } from '@/src/shared/lib/crypto/keyStore'
import { encryptCredential } from '@/src/shared/lib/crypto/cryptoAdapter'
import { CredentialFormScreen } from '../CredentialFormScreen'
import {
  credentialFixture,
  getCredentialSuccessHandler,
  updateCredentialSuccessHandler,
} from '../../hooks/__tests__/mocks/credentialHandlers'

const TEST_KEY = new Uint8Array(32).fill(7)

const mockBack = jest.fn()
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack }) }))

function renderScreen(credentialId?: string) {
  const queryClient = createTestQueryClient()
  return renderWithProviders(
    <QueryClientProvider client={queryClient}>
      <CredentialFormScreen credentialId={credentialId} />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  setEncryptionKey(TEST_KEY)
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

  it('sends a null encryptedPin when the PIN field is left blank', async () => {
    let capturedBody: { encryptedPin?: string | null } | undefined
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

    expect(capturedBody?.encryptedPin).toBeNull()
  })

  it('encrypts a numeric PIN before sending it to the server on create', async () => {
    let capturedBody: { encryptedPin?: string | null } | undefined
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
    await fireEvent.changeText(screen.getByLabelText('PIN (optional)'), '2468')
    await fireEvent.press(screen.getByRole('button', { name: 'Add credential' }))

    await waitFor(() => expect(mockBack).toHaveBeenCalled())

    expect(capturedBody?.encryptedPin).toBeDefined()
    expect(capturedBody?.encryptedPin).not.toContain('2468')
    expect(capturedBody?.encryptedPin).toMatch(/^[A-Za-z0-9+/]+=*:[A-Za-z0-9+/]+=*$/)
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

  it('pre-fills password and PIN fields with decrypted values when editing so the user is not forced to retype them', async () => {
    const encryptedPassword = await encryptCredential('correct-horse-battery-staple', TEST_KEY)
    const encryptedPin = await encryptCredential('4321', TEST_KEY)
    server.use(
      rest.get(`${API_BASE_URL}/credentials/:id`, (req, res, ctx) =>
        res(
          ctx.status(200),
          ctx.json({
            success: true,
            data: { ...credentialFixture, id: req.params.id, encryptedPassword, encryptedPin },
            meta: null,
          }),
        ),
      ),
    )

    await renderScreen('cred-1')

    expect(await screen.findByDisplayValue('correct-horse-battery-staple')).toBeTruthy()
    expect(screen.getByDisplayValue('4321')).toBeTruthy()
  })

  it('submits successfully when editing only the note, without retyping the password', async () => {
    const encryptedPassword = await encryptCredential('correct-horse-battery-staple', TEST_KEY)
    server.use(
      rest.get(`${API_BASE_URL}/credentials/:id`, (req, res, ctx) =>
        res(
          ctx.status(200),
          ctx.json({ success: true, data: { ...credentialFixture, id: req.params.id, encryptedPassword }, meta: null }),
        ),
      ),
    )
    let capturedBody: { encryptedPassword?: string; note?: string | null } | undefined
    server.use(
      rest.patch(`${API_BASE_URL}/credentials/:id`, async (req, res, ctx) => {
        capturedBody = await req.json()
        return res(ctx.status(200), ctx.json({ success: true, data: { ...credentialFixture, ...capturedBody }, meta: null }))
      }),
    )

    await renderScreen('cred-1')

    await screen.findByDisplayValue('correct-horse-battery-staple')

    await fireEvent.changeText(screen.getByLabelText('Note (optional)'), 'Updated note')
    await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(mockBack).toHaveBeenCalled())

    expect(capturedBody?.note).toBe('Updated note')
    expect(capturedBody?.encryptedPassword).not.toContain('correct-horse-battery-staple')
  })
})
