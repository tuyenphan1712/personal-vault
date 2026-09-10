import { fireEvent, screen, waitFor } from '@testing-library/react-native'
import { renderWithProviders } from '@/src/shared/testing/renderWithProviders'
import { useProfile } from '../../hooks/useProfile'
import { useUpdateProfile } from '../../hooks/useUpdateProfile'
import { useChangePassword } from '@/src/features/auth/hooks/useChangePassword'
import { ProfileScreen } from '../ProfileScreen'

jest.mock('../../hooks/useProfile')
jest.mock('../../hooks/useUpdateProfile')
jest.mock('@/src/features/auth/hooks/useChangePassword', () => {
  const actual = jest.requireActual('@/src/features/auth/hooks/useChangePassword')
  return { ...actual, useChangePassword: jest.fn() }
})

const mockedUseProfile = useProfile as jest.MockedFunction<typeof useProfile>
const mockedUseUpdateProfile = useUpdateProfile as jest.MockedFunction<typeof useUpdateProfile>
const mockedUseChangePassword = useChangePassword as jest.MockedFunction<typeof useChangePassword>

const PROFILE = {
  id: 'u1',
  phone: '0900000001',
  fullName: 'Jane Doe',
  role: 'member' as const,
  status: 'active' as const,
  birthday: '1990-01-01',
}

function profileQueryResult(overrides: Partial<ReturnType<typeof useProfile>> = {}) {
  return {
    data: PROFILE,
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useProfile>
}

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

beforeEach(() => {
  mockedUseProfile.mockReturnValue(profileQueryResult())
  mockedUseUpdateProfile.mockReturnValue({ mutate: jest.fn(), isPending: false, error: null } as unknown as ReturnType<typeof useUpdateProfile>)
  mockedUseChangePassword.mockReturnValue(mutationResult())
})

describe('ProfileScreen', () => {
  it('shows a Change password toggle and reveals the form when pressed', async () => {
    await renderWithProviders(<ProfileScreen />)

    expect(screen.getByRole('button', { name: 'Change password' })).toBeTruthy()

    fireEvent.press(screen.getByRole('button', { name: 'Change password' }))

    expect(await screen.findByLabelText('Current password')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy()
  })

  it('returns to the toggle view when Cancel is pressed', async () => {
    await renderWithProviders(<ProfileScreen />)

    fireEvent.press(screen.getByRole('button', { name: 'Change password' }))
    await screen.findByLabelText('Current password')

    fireEvent.press(screen.getByRole('button', { name: 'Cancel' }))

    await waitFor(() => expect(screen.queryByLabelText('Current password')).toBeNull())
    expect(screen.getByRole('button', { name: 'Change password' })).toBeTruthy()
  })

  it('returns to the toggle view after a successful password change', async () => {
    const mutate = jest.fn((_input: unknown, options?: { onSuccess?: (...args: never[]) => void }) => options?.onSuccess?.())
    mockedUseChangePassword.mockReturnValue(mutationResult({ mutate }))
    await renderWithProviders(<ProfileScreen />)

    fireEvent.press(screen.getByRole('button', { name: 'Change password' }))
    await screen.findByLabelText('Current password')

    fireEvent.changeText(screen.getByLabelText('Current password'), 'old-password')
    fireEvent.changeText(screen.getByLabelText('New password'), 'new-password-123')
    fireEvent.changeText(screen.getByLabelText('Confirm new password'), 'new-password-123')
    fireEvent.press(screen.getByRole('button', { name: 'Change password' }))

    await waitFor(() => expect(screen.queryByLabelText('Current password')).toBeNull())
    expect(screen.getByRole('button', { name: 'Change password' })).toBeTruthy()
  })
})
