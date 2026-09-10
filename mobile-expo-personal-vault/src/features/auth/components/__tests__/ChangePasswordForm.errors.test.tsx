import { AxiosError } from 'axios'
import { fireEvent, screen, waitFor } from '@testing-library/react-native'
import { renderWithProviders } from '@/src/shared/testing/renderWithProviders'
import { IncorrectCurrentPasswordError, useChangePassword } from '../../hooks/useChangePassword'
import { ChangePasswordForm } from '../ChangePasswordForm'

// Split from ChangePasswordForm.test.tsx: mixing RHF's async zodResolver validation flow with
// these mocked-mutation-state renders in the same file left dangling act() work that corrupted
// later renders in this Jest/RN/React 19 combination (observed as a blank tree on the next
// render). Each Jest test file gets its own module/act-tracking state, so splitting sidesteps it.

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

function axiosErrorWithCode(code: string) {
  return new AxiosError('failed', undefined, undefined, undefined, {
    status: code === 'AUTH_006' ? 401 : 409,
    data: { success: false, error: { code, message: 'failed', details: null } },
  } as never)
}

async function renderForm(onSuccess = jest.fn()) {
  await renderWithProviders(<ChangePasswordForm onSuccess={onSuccess} />)
  return { onSuccess }
}

beforeEach(() => {
  mockedUseChangePassword.mockReturnValue(mutationResult())
})

describe('ChangePasswordForm error mapping', () => {
  // Render-only assertions (no fireEvent.press) come first: a test that presses the submit
  // button drives RHF's async zodResolver chain, which leaves dangling act() work that
  // corrupts whatever renders next in this Jest/RN/React 19 combination (observed as a blank
  // tree). Ordering the pure-render tests before the one press-driven test sidesteps it.
  it('shows an incorrect-current-password message for a client-side IncorrectCurrentPasswordError', async () => {
    mockedUseChangePassword.mockReturnValue(mutationResult({ error: new IncorrectCurrentPasswordError(), isError: true }))

    await renderForm()

    expect(await screen.findByText('Current password is incorrect')).toBeTruthy()
  })

  it('shows an incorrect-current-password message for an AUTH_006 server error', async () => {
    mockedUseChangePassword.mockReturnValue(mutationResult({ error: axiosErrorWithCode('AUTH_006'), isError: true }))

    await renderForm()

    expect(await screen.findByText('Current password is incorrect')).toBeTruthy()
  })

  it('shows a retry message for a CREDENTIAL_002 server error', async () => {
    mockedUseChangePassword.mockReturnValue(mutationResult({ error: axiosErrorWithCode('CREDENTIAL_002'), isError: true }))

    await renderForm()

    expect(await screen.findByText('Your credentials changed while this form was open. Please try again.')).toBeTruthy()
  })

  it('shows a generic error message for any other failure', async () => {
    mockedUseChangePassword.mockReturnValue(mutationResult({ error: new Error('boom'), isError: true }))

    await renderForm()

    expect(await screen.findByText('Could not change your password. Try again.')).toBeTruthy()
  })

  it('calls mutate with the entered passwords and wires onSuccess through', async () => {
    const mutate = jest.fn((_input: unknown, options?: { onSuccess?: (...args: never[]) => void }) => options?.onSuccess?.())
    mockedUseChangePassword.mockReturnValue(mutationResult({ mutate }))
    const { onSuccess } = await renderForm()

    fireEvent.changeText(await screen.findByLabelText('Current password'), 'old-password')
    fireEvent.changeText(screen.getByLabelText('New password'), 'new-password-123')
    fireEvent.changeText(screen.getByLabelText('Confirm new password'), 'new-password-123')
    fireEvent.press(screen.getByRole('button', { name: 'Change password' }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(mutate).toHaveBeenCalledWith(
      { currentPassword: 'old-password', newPassword: 'new-password-123' },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    )
  })
})
