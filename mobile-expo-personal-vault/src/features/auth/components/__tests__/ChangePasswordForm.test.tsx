import { fireEvent, screen } from '@testing-library/react-native'
import { renderWithProviders } from '@/src/shared/testing/renderWithProviders'
import { useChangePassword } from '../../hooks/useChangePassword'
import { ChangePasswordForm } from '../ChangePasswordForm'

jest.mock('../../hooks/useChangePassword', () => {
  const actual = jest.requireActual('../../hooks/useChangePassword')
  return { ...actual, useChangePassword: jest.fn() }
})

const mockedUseChangePassword = useChangePassword as jest.MockedFunction<typeof useChangePassword>

function mutationResult(overrides: Partial<ReturnType<typeof useChangePassword>> = {}) {
  return {
    mutate: jest.fn(),
    error: null,
    isError: false,
    isPending: false,
    isSuccess: false,
    ...overrides,
  } as unknown as ReturnType<typeof useChangePassword>
}

async function renderForm(onSuccess = jest.fn()) {
  await renderWithProviders(<ChangePasswordForm onSuccess={onSuccess} />)
  return { onSuccess }
}

beforeEach(() => {
  mockedUseChangePassword.mockReturnValue(mutationResult())
})

describe('ChangePasswordForm', () => {
  it('renders all fields', async () => {
    await renderForm()

    expect(screen.getByLabelText('Current password')).toBeTruthy()
    expect(screen.getByLabelText('New password')).toBeTruthy()
    expect(screen.getByLabelText('Confirm new password')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Change password' })).toBeTruthy()
  })

  it('shows a validation error when the confirmation does not match the new password', async () => {
    await renderForm()

    fireEvent.changeText(await screen.findByLabelText('Current password'), 'old-password')
    fireEvent.changeText(screen.getByLabelText('New password'), 'new-password-123')
    fireEvent.changeText(screen.getByLabelText('Confirm new password'), 'does-not-match')
    fireEvent.press(screen.getByRole('button', { name: 'Change password' }))

    expect(await screen.findByText('Passwords do not match')).toBeTruthy()
    expect(mockedUseChangePassword.mock.results[0].value.mutate).not.toHaveBeenCalled()
  })
})
