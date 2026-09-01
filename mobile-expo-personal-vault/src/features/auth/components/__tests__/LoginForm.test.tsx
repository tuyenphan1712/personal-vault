import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { LoginForm } from '../LoginForm'

describe('LoginForm', () => {
  it('renders the phone and password fields', async () => {
    await render(<LoginForm onSubmit={jest.fn()} isSubmitting={false} errorMessage={null} />)

    expect(screen.getByLabelText('Phone number')).toBeTruthy()
    expect(screen.getByLabelText('Password')).toBeTruthy()
  })

  it('shows validation errors and does not submit when fields are invalid', async () => {
    const onSubmit = jest.fn()
    await render(<LoginForm onSubmit={onSubmit} isSubmitting={false} errorMessage={null} />)

    await fireEvent.changeText(screen.getByLabelText('Password'), 'short')
    await fireEvent.press(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByText('Phone number is required')).toBeTruthy()
    expect(await screen.findByText('Password must be at least 8 characters')).toBeTruthy()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('calls onSubmit with the entered values when valid', async () => {
    const onSubmit = jest.fn()
    await render(<LoginForm onSubmit={onSubmit} isSubmitting={false} errorMessage={null} />)

    await fireEvent.changeText(screen.getByLabelText('Phone number'), '0900000000')
    await fireEvent.changeText(screen.getByLabelText('Password'), 'a-strong-password')
    await fireEvent.press(screen.getByRole('button', { name: 'Log in' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onSubmit.mock.calls[0][0]).toEqual({ phone: '0900000000', password: 'a-strong-password' })
  })

  it('shows the server error message when provided', async () => {
    await render(<LoginForm onSubmit={jest.fn()} isSubmitting={false} errorMessage="Invalid phone or password" />)

    expect(screen.getByText('Invalid phone or password')).toBeTruthy()
  })

  it('disables the submit button while submitting', async () => {
    await render(<LoginForm onSubmit={jest.fn()} isSubmitting errorMessage={null} />)

    expect(screen.getByRole('button')).toBeDisabled()
  })
})
