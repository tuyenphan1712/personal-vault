import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { ROUTES } from '@/routes/routes'
import { createQueryClientWrapper } from '@/test/QueryClientWrapper'
import { server } from '@/test/msw/server'
import { RegisterPage } from './RegisterPage'

const navigateMock = vi.fn()

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')
  return { ...actual, useNavigate: () => navigateMock }
})

function renderPage() {
  const Wrapper = createQueryClientWrapper()
  return render(
    <MemoryRouter>
      <Wrapper>
        <RegisterPage />
      </Wrapper>
    </MemoryRouter>,
  )
}

describe('RegisterPage', () => {
  afterEach(() => {
    navigateMock.mockClear()
  })

  it('renders the register title and a link to log in', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Create your vault' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Log in' })).toBeInTheDocument()
  })

  it('navigates to the login page after a successful registration', async () => {
    server.use(
      http.post(`${API_BASE_URL}/auth/register`, () =>
        HttpResponse.json({
          success: true,
          data: { id: 'u1', phone: '0900000001', fullName: 'Test User', role: 'member', status: 'active' },
          meta: null,
        }),
      ),
    )
    renderPage()

    await userEvent.type(screen.getByLabelText('Full name'), 'Test User')
    await userEvent.type(screen.getByLabelText('Phone number'), '0900000001')
    await userEvent.type(screen.getByLabelText('Password'), 'a-valid-password')
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith(ROUTES.LOGIN))
  })

  it('does not navigate when registration fails', async () => {
    server.use(
      http.post(`${API_BASE_URL}/auth/register`, () =>
        HttpResponse.json(
          { success: false, error: { code: 'USER_002', message: 'Phone number already registered', details: null } },
          { status: 409 },
        ),
      ),
    )
    renderPage()

    await userEvent.type(screen.getByLabelText('Full name'), 'Test User')
    await userEvent.type(screen.getByLabelText('Phone number'), '0900000001')
    await userEvent.type(screen.getByLabelText('Password'), 'a-valid-password')
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByText('This phone number is already registered.')).toBeInTheDocument()
    expect(navigateMock).not.toHaveBeenCalled()
  })
})
