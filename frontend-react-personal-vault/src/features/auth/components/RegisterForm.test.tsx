import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { createQueryClientWrapper } from '@/test/QueryClientWrapper'
import { server } from '@/test/msw/server'
import { RegisterForm } from './RegisterForm'

function renderForm(onSuccess = vi.fn()) {
  const Wrapper = createQueryClientWrapper()
  render(
    <Wrapper>
      <RegisterForm onSuccess={onSuccess} />
    </Wrapper>,
  )
  return { onSuccess }
}

describe('RegisterForm', () => {
  it('renders the full name, phone, and password fields', () => {
    renderForm()

    expect(screen.getByLabelText('Full name')).toBeInTheDocument()
    expect(screen.getByLabelText('Phone number')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument()
  })

  it('shows validation errors when submitted empty', async () => {
    renderForm()

    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByText('Full name is required')).toBeInTheDocument()
    expect(screen.getByText('Phone number is invalid')).toBeInTheDocument()
    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument()
  })

  it('rejects a phone number that does not match the required digit pattern', async () => {
    renderForm()

    await userEvent.type(screen.getByLabelText('Phone number'), 'abc123')
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByText('Phone number is invalid')).toBeInTheDocument()
  })

  it('rejects a password shorter than 8 characters', async () => {
    renderForm()

    await userEvent.type(screen.getByLabelText('Password'), 'short1')
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByText('Password must be at least 8 characters')).toBeInTheDocument()
  })

  it('calls the register mutation with valid input and invokes onSuccess', async () => {
    let capturedBody: unknown
    server.use(
      http.post(`${API_BASE_URL}/auth/register`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({
          success: true,
          data: { id: 'u1', phone: '0900000001', fullName: 'Test User', role: 'member', status: 'active' },
          meta: null,
        })
      }),
    )
    const { onSuccess } = renderForm()

    await userEvent.type(screen.getByLabelText('Full name'), 'Test User')
    await userEvent.type(screen.getByLabelText('Phone number'), '0900000001')
    await userEvent.type(screen.getByLabelText('Password'), 'a-valid-password')
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(capturedBody).toEqual({ phone: '0900000001', password: 'a-valid-password', fullName: 'Test User' })
  })

  it('shows an error message when the phone number is already registered', async () => {
    server.use(
      http.post(`${API_BASE_URL}/auth/register`, () =>
        HttpResponse.json(
          { success: false, error: { code: 'USER_002', message: 'Phone number already registered', details: null } },
          { status: 409 },
        ),
      ),
    )
    renderForm()

    await userEvent.type(screen.getByLabelText('Full name'), 'Test User')
    await userEvent.type(screen.getByLabelText('Phone number'), '0900000001')
    await userEvent.type(screen.getByLabelText('Password'), 'a-valid-password')
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByText('This phone number is already registered.')).toBeInTheDocument()
  })

  it('disables the submit button while the register request is pending', async () => {
    server.use(
      http.post(`${API_BASE_URL}/auth/register`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
        return HttpResponse.json({
          success: true,
          data: { id: 'u1', phone: '0900000001', fullName: 'Test User', role: 'member', status: 'active' },
          meta: null,
        })
      }),
    )
    renderForm()

    await userEvent.type(screen.getByLabelText('Full name'), 'Test User')
    await userEvent.type(screen.getByLabelText('Phone number'), '0900000001')
    await userEvent.type(screen.getByLabelText('Password'), 'a-valid-password')
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByRole('button', { name: 'Loading…' })).toBeDisabled()
  })
})
