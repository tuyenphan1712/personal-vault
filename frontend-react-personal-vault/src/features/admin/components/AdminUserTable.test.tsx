import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { createQueryClientWrapper } from '@/test/QueryClientWrapper'
import { server } from '@/test/msw/server'
import type { AdminUser } from '../types/admin.types'
import { AdminUserTable } from './AdminUserTable'

const USERS: AdminUser[] = [
  { id: 'u1', phone: '0900000001', fullName: 'Jane Doe', role: 'member', status: 'active', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'u2', phone: '0900000002', fullName: 'John Roe', role: 'member', status: 'locked', createdAt: '2026-01-02T00:00:00Z' },
]

function mockUsersEndpoint(handler: Parameters<typeof http.get>[1]) {
  server.use(http.get(`${API_BASE_URL}/admin/users`, handler))
}

function renderTable() {
  const Wrapper = createQueryClientWrapper()
  return render(
    <Wrapper>
      <AdminUserTable onNotify={vi.fn()} onRequestDelete={vi.fn()} />
    </Wrapper>,
  )
}

describe('AdminUserTable', () => {
  it('renders a loading state', () => {
    mockUsersEndpoint(
      () => new Promise(() => {}), // never resolves
    )

    renderTable()

    expect(screen.getByText('Loading users…')).toBeInTheDocument()
  })

  it('renders an error state when the request fails', async () => {
    mockUsersEndpoint(() =>
      HttpResponse.json({ success: false, error: { code: 'ADMIN_001', message: 'Forbidden', details: null } }, { status: 403 }),
    )

    renderTable()

    expect(await screen.findByText("Couldn't load users. Try again.")).toBeInTheDocument()
  })

  it('renders an empty state when there are no users', async () => {
    mockUsersEndpoint(() =>
      HttpResponse.json({ success: true, data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } }),
    )

    renderTable()

    expect(await screen.findByText('No users found')).toBeInTheDocument()
  })

  it('renders the list of users with pagination when there is more than one page', async () => {
    mockUsersEndpoint(() =>
      HttpResponse.json({ success: true, data: USERS, meta: { page: 1, limit: 20, total: 40, totalPages: 2 } }),
    )

    renderTable()

    expect(await screen.findByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('John Roe')).toBeInTheDocument()
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled()
  })

  it('sends the typed search text as a query param and resets to page 1', async () => {
    let lastSearch: string | null = null
    let lastPage: string | null = null
    mockUsersEndpoint(({ request }) => {
      const url = new URL(request.url)
      lastSearch = url.searchParams.get('search')
      lastPage = url.searchParams.get('page')
      return HttpResponse.json({ success: true, data: USERS, meta: { page: 1, limit: 20, total: 2, totalPages: 1 } })
    })

    renderTable()
    await screen.findByText('Jane Doe')

    await userEvent.type(screen.getByPlaceholderText('Search by phone or full name…'), 'jane')

    await waitFor(() => expect(lastSearch).toBe('jane'))
    expect(lastPage).toBe('1')
  })

  it('requests the next page when Next is clicked', async () => {
    let lastPage: string | null = null
    mockUsersEndpoint(({ request }) => {
      lastPage = new URL(request.url).searchParams.get('page')
      return HttpResponse.json({ success: true, data: USERS, meta: { page: Number(lastPage), limit: 20, total: 40, totalPages: 2 } })
    })

    renderTable()
    await screen.findByText('Page 1 of 2')

    await userEvent.click(screen.getByRole('button', { name: 'Next' }))

    await waitFor(() => expect(lastPage).toBe('2'))
  })
})
