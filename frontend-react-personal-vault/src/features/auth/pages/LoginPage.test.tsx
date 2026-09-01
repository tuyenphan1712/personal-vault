import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { ROUTES } from '@/routes/routes'
import { createQueryClientWrapper } from '@/test/QueryClientWrapper'
import { server } from '@/test/msw/server'
import { LoginPage } from './LoginPage'

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
        <LoginPage />
      </Wrapper>
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  afterEach(() => {
    navigateMock.mockClear()
  })

  it('renders the login title and a link to register', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Register' })).toBeInTheDocument()
  })

  it('navigates to the dashboard after a successful login', async () => {
    server.use(
      http.post(`${API_BASE_URL}/auth/login`, () =>
        HttpResponse.json({
          success: true,
          data: {
            user: { id: 'u1', phone: '0900000001', fullName: 'Test User', role: 'member' },
            accessToken: 'fake-access-token',
            refreshToken: null,
            expiresIn: 900,
          },
          meta: null,
        }),
      ),
    )
    renderPage()

    await userEvent.type(screen.getByLabelText('Phone number'), '0900000001')
    await userEvent.type(screen.getByLabelText('Password'), 'not-a-real-password')
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith(ROUTES.DASHBOARD))
  })

  it('does not navigate when login fails', async () => {
    server.use(
      http.post(`${API_BASE_URL}/auth/login`, () =>
        HttpResponse.json(
          { success: false, error: { code: 'AUTH_001', message: 'Invalid phone or password', details: null } },
          { status: 401 },
        ),
      ),
    )
    renderPage()

    await userEvent.type(screen.getByLabelText('Phone number'), '0900000001')
    await userEvent.type(screen.getByLabelText('Password'), 'wrong-password')
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByText('Invalid phone number or password.')).toBeInTheDocument()
    expect(navigateMock).not.toHaveBeenCalled()
  })
})
