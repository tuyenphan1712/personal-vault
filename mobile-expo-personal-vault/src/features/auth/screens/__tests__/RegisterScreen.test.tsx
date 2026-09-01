import { QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { server } from '@/src/shared/testing/msw/server'
import { createTestQueryClient } from '@/src/shared/testing/queryClient'
import { RegisterScreen } from '../RegisterScreen'
import { registerDuplicatePhoneHandler, registerSuccessHandler } from '../../hooks/__tests__/mocks/authHandlers'

const mockReplace = jest.fn()
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }))

function renderScreen() {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <RegisterScreen />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('RegisterScreen', () => {
  it('registers and navigates to the login screen on success', async () => {
    server.use(registerSuccessHandler)
    await renderScreen()

    await fireEvent.changeText(screen.getByLabelText('Full name'), 'Nguyen Van A')
    await fireEvent.changeText(screen.getByLabelText('Phone number'), '0900000000')
    await fireEvent.changeText(screen.getByLabelText('Password'), 'a-strong-password')
    await fireEvent.press(screen.getByRole('button', { name: 'Register' }))

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(public)/login'))
  })

  it('shows an error message and does not navigate when the phone is already registered', async () => {
    server.use(registerDuplicatePhoneHandler)
    await renderScreen()

    await fireEvent.changeText(screen.getByLabelText('Full name'), 'Nguyen Van A')
    await fireEvent.changeText(screen.getByLabelText('Phone number'), '0900000000')
    await fireEvent.changeText(screen.getByLabelText('Password'), 'a-strong-password')
    await fireEvent.press(screen.getByRole('button', { name: 'Register' }))

    expect(await screen.findByText('Phone number already registered')).toBeTruthy()
    expect(mockReplace).not.toHaveBeenCalled()
  })
})
