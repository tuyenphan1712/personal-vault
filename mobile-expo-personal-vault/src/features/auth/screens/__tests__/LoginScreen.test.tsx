import { QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { server } from '@/src/shared/testing/msw/server'
import { createTestQueryClient } from '@/src/shared/testing/queryClient'
import { setAccessToken } from '@/src/shared/lib/auth/tokenStore'
import { useAuthStore } from '../../stores/auth.store'
import { LoginScreen } from '../LoginScreen'
import { loginSuccessHandler, VALID_PASSWORD, VALID_PHONE } from '../../hooks/__tests__/mocks/authHandlers'

const mockReplace = jest.fn()
const mockPush = jest.fn()
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace, push: mockPush }) }))

jest.mock('@/src/shared/lib/storage/secureStorage', () => ({
  setRefreshToken: jest.fn().mockResolvedValue(undefined),
  getRefreshToken: jest.fn().mockResolvedValue(null),
  clearRefreshToken: jest.fn().mockResolvedValue(undefined),
}))

function renderScreen() {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <LoginScreen />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  setAccessToken(null)
  useAuthStore.setState({ user: null, isAuthenticated: false, isSessionLoading: false, isAppLocked: false })
  jest.clearAllMocks()
})

describe('LoginScreen', () => {
  it('logs in and sets the session on success, without navigating imperatively', async () => {
    // Navigation to /(protected) is left entirely to app/(public)/_layout.tsx reacting to
    // isAuthenticated — an imperative router.replace() here previously raced that redirect.
    server.use(loginSuccessHandler)
    await renderScreen()

    await fireEvent.changeText(screen.getByLabelText('Phone number'), VALID_PHONE)
    await fireEvent.changeText(screen.getByLabelText('Password'), VALID_PASSWORD)
    await fireEvent.press(screen.getByRole('button', { name: 'Log in' }))

    await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(true), { timeout: 5000 })
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('shows an error message and does not change the session on invalid credentials', async () => {
    server.use(loginSuccessHandler)
    await renderScreen()

    await fireEvent.changeText(screen.getByLabelText('Phone number'), VALID_PHONE)
    await fireEvent.changeText(screen.getByLabelText('Password'), 'wrong-password')
    await fireEvent.press(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByText('Invalid phone or password')).toBeTruthy()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(mockReplace).not.toHaveBeenCalled()
  })
})
