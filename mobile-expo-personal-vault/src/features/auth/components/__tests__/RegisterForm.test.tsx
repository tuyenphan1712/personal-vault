import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { RegisterForm } from '../RegisterForm'

describe('RegisterForm', () => {
  it('renders all fields', async () => {
    await render(<RegisterForm onSubmit={jest.fn()} isSubmitting={false} errorMessage={null} />)

    expect(screen.getByLabelText('Full name')).toBeTruthy()
    expect(screen.getByLabelText('Phone number')).toBeTruthy()
    expect(screen.getByLabelText('Password')).toBeTruthy()
  })

  it('shows validation errors for invalid input', async () => {
    const onSubmit = jest.fn()
    await render(<RegisterForm onSubmit={onSubmit} isSubmitting={false} errorMessage={null} />)

    await fireEvent.changeText(screen.getByLabelText('Password'), 'short')
    await fireEvent.press(screen.getByRole('button', { name: 'Register' }))

    expect(await screen.findByText('Full name is required')).toBeTruthy()
    expect(await screen.findByText('Phone number is required')).toBeTruthy()
    expect(await screen.findByText('Password must be at least 8 characters')).toBeTruthy()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('calls onSubmit with the entered values when valid', async () => {
    const onSubmit = jest.fn()
    await render(<RegisterForm onSubmit={onSubmit} isSubmitting={false} errorMessage={null} />)

    await fireEvent.changeText(screen.getByLabelText('Full name'), 'Nguyen Van A')
    await fireEvent.changeText(screen.getByLabelText('Phone number'), '0900000000')
    await fireEvent.changeText(screen.getByLabelText('Password'), 'a-strong-password')
    await fireEvent.press(screen.getByRole('button', { name: 'Register' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onSubmit.mock.calls[0][0]).toEqual({
      fullName: 'Nguyen Van A',
      phone: '0900000000',
      password: 'a-strong-password',
    })
  })

  it('shows the server error message when provided', async () => {
    await render(<RegisterForm onSubmit={jest.fn()} isSubmitting={false} errorMessage="Phone number already registered" />)

    expect(screen.getByText('Phone number already registered')).toBeTruthy()
  })

  it('disables the submit button while submitting', async () => {
    await render(<RegisterForm onSubmit={jest.fn()} isSubmitting errorMessage={null} />)

    expect(screen.getByRole('button')).toBeDisabled()
  })
})
