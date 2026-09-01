import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { createQueryClientWrapper } from '@/test/QueryClientWrapper'
import { server } from '@/test/msw/server'
import { LoginForm } from './LoginForm'

// Key derivation runs for real in these tests (native WebCrypto under jsdom) since it's cheap
// enough at the configured PBKDF2 iteration count not to warrant mocking at this layer.

function renderForm(onSuccess = vi.fn()) {
  const Wrapper = createQueryClientWrapper()
  render(
    <Wrapper>
      <LoginForm onSuccess={onSuccess} />
    </Wrapper>,
  )
  return { onSuccess }
}

describe('LoginForm', () => {
  it('renders the phone and password fields', () => {
    renderForm()

    expect(screen.getByLabelText('Phone number')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument()
  })

  it('shows validation errors when submitted empty', async () => {
    renderForm()

    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByText('Phone number is required')).toBeInTheDocument()
    expect(screen.getByText('Password is required')).toBeInTheDocument()
  })

  it('calls the login mutation with the entered credentials and invokes onSuccess', async () => {
    let capturedBody: unknown
    server.use(
      http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({
          success: true,
          data: {
            user: { id: 'u1', phone: '0900000001', fullName: 'Test User', role: 'member' },
            accessToken: 'fake-access-token',
            refreshToken: null,
            expiresIn: 900,
          },
          meta: null,
        })
      }),
    )
    const { onSuccess } = renderForm()

    await userEvent.type(screen.getByLabelText('Phone number'), '0900000001')
    await userEvent.type(screen.getByLabelText('Password'), 'not-a-real-password')
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(capturedBody).toEqual({ phone: '0900000001', password: 'not-a-real-password' })
  })

  it('shows an error message when login fails with invalid credentials', async () => {
    server.use(
      http.post(`${API_BASE_URL}/auth/login`, () =>
        HttpResponse.json(
          { success: false, error: { code: 'AUTH_001', message: 'Invalid phone or password', details: null } },
          { status: 401 },
        ),
      ),
    )
    renderForm()

    await userEvent.type(screen.getByLabelText('Phone number'), '0900000001')
    await userEvent.type(screen.getByLabelText('Password'), 'wrong-password')
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByText('Invalid phone number or password.')).toBeInTheDocument()
  })

  it('disables the submit button while the login request is pending', async () => {
    server.use(
      http.post(`${API_BASE_URL}/auth/login`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
        return HttpResponse.json({
          success: true,
          data: {
            user: { id: 'u1', phone: '0900000001', fullName: 'Test User', role: 'member' },
            accessToken: 'fake-access-token',
            refreshToken: null,
            expiresIn: 900,
          },
          meta: null,
        })
      }),
    )
    renderForm()

    await userEvent.type(screen.getByLabelText('Phone number'), '0900000001')
    await userEvent.type(screen.getByLabelText('Password'), 'not-a-real-password')
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByRole('button', { name: 'Loading…' })).toBeDisabled()
  })
})
