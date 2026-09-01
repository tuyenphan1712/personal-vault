import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { createQueryClientWrapper } from '@/test/QueryClientWrapper'
import { server } from '@/test/msw/server'
import { ProfilePage } from './ProfilePage'

const PROFILE = {
  id: 'u1',
  phone: '0900000001',
  fullName: 'Jane Doe',
  role: 'member',
  status: 'active',
  birthday: '1990-01-01',
}

function renderPage() {
  const Wrapper = createQueryClientWrapper()
  return render(
    <MemoryRouter>
      <Wrapper>
        <ProfilePage />
      </Wrapper>
    </MemoryRouter>,
  )
}

describe('ProfilePage', () => {
  it('shows a loading state, then the page title and fetched profile', async () => {
    server.use(http.get(`${API_BASE_URL}/profile`, () => HttpResponse.json({ success: true, data: PROFILE, meta: null })))

    renderPage()

    expect(screen.getByRole('heading', { name: 'Profile' })).toBeInTheDocument()
    expect(screen.getByText('Loading…')).toBeInTheDocument()

    expect(await screen.findByText('0900000001')).toBeInTheDocument()
    expect(screen.getAllByText('Jane Doe').length).toBeGreaterThan(0)
  })

  it('shows an error message when the profile fails to load', async () => {
    server.use(
      http.get(`${API_BASE_URL}/profile`, () =>
        HttpResponse.json({ success: false, error: { code: 'AUTH_005', message: 'Unauthorized', details: null } }, { status: 401 }),
      ),
    )

    renderPage()

    expect(await screen.findByText('Could not load profile.')).toBeInTheDocument()
  })

  it('toggles into edit mode and reflects a successful update', async () => {
    server.use(http.get(`${API_BASE_URL}/profile`, () => HttpResponse.json({ success: true, data: PROFILE, meta: null })))
    renderPage()
    await screen.findByText('0900000001')

    await userEvent.click(screen.getByRole('button', { name: 'Edit profile' }))
    expect(screen.getByLabelText('Full name')).toHaveValue('Jane Doe')

    server.use(
      http.patch(`${API_BASE_URL}/profile`, () => HttpResponse.json({ success: true, data: { ...PROFILE, fullName: 'John Doe' }, meta: null })),
    )
    server.use(http.get(`${API_BASE_URL}/profile`, () => HttpResponse.json({ success: true, data: { ...PROFILE, fullName: 'John Doe' }, meta: null })))

    await userEvent.clear(screen.getByLabelText('Full name'))
    await userEvent.type(screen.getByLabelText('Full name'), 'John Doe')
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument())
    expect(await screen.findAllByText('John Doe')).not.toHaveLength(0)
  })

  it('returns to read-only view when Cancel is clicked', async () => {
    server.use(http.get(`${API_BASE_URL}/profile`, () => HttpResponse.json({ success: true, data: PROFILE, meta: null })))
    renderPage()
    await screen.findByText('0900000001')

    await userEvent.click(screen.getByRole('button', { name: 'Edit profile' }))
    expect(screen.getByLabelText('Full name')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByLabelText('Full name')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit profile' })).toBeInTheDocument()
  })
})
