import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { useAuthStore } from '@/features/auth'
import { createQueryClientWrapper } from '@/test/QueryClientWrapper'
import { server } from '@/test/msw/server'
import type { AdminUser } from '../types/admin.types'
import { AdminUsersPage } from './AdminUsersPage'

const ADMIN_ID = 'admin-1'
const USERS: AdminUser[] = [
  { id: ADMIN_ID, phone: '0900000000', fullName: 'Admin User', role: 'admin', status: 'active', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'u2', phone: '0900000002', fullName: 'Jane Doe', role: 'member', status: 'active', createdAt: '2026-01-02T00:00:00Z' },
]

function findRow(name: string) {
  const row = screen.getByText(name).closest('tr')
  if (!row) {
    throw new Error(`row containing "${name}" not found`)
  }
  return within(row)
}

function renderPage() {
  useAuthStore.setState({
    user: { id: ADMIN_ID, phone: '0900000000', fullName: 'Admin User', role: 'admin' },
    isAuthenticated: true,
    isSessionLoading: false,
  })

  const Wrapper = createQueryClientWrapper()
  return render(
    <MemoryRouter>
      <Wrapper>
        <AdminUsersPage />
      </Wrapper>
    </MemoryRouter>,
  )
}

describe('AdminUsersPage', () => {
  afterEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false, isSessionLoading: false })
  })

  it('renders the page title and the fetched users', async () => {
    server.use(
      http.get(`${API_BASE_URL}/admin/users`, () =>
        HttpResponse.json({ success: true, data: USERS, meta: { page: 1, limit: 20, total: 2, totalPages: 1 } }),
      ),
    )

    renderPage()

    expect(screen.getByRole('heading', { name: 'User management' })).toBeInTheDocument()
    expect(await screen.findByText('Jane Doe')).toBeInTheDocument()
  })

  it('deletes a user end-to-end: request delete -> confirm dialog -> DELETE call -> toast', async () => {
    server.use(
      http.get(`${API_BASE_URL}/admin/users`, () =>
        HttpResponse.json({ success: true, data: USERS, meta: { page: 1, limit: 20, total: 2, totalPages: 1 } }),
      ),
    )
    let deleteCalled = false
    server.use(
      http.delete(`${API_BASE_URL}/admin/users/:id`, ({ params }) => {
        deleteCalled = true
        expect(params.id).toBe('u2')
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderPage()
    await screen.findByText('Jane Doe')

    await userEvent.click(findRow('Jane Doe').getByRole('button', { name: 'Delete' }))

    expect(screen.getByRole('dialog')).toHaveTextContent('Jane Doe')

    await userEvent.click(screen.getByRole('button', { name: 'Delete account' }))

    await waitFor(() => expect(deleteCalled).toBe(true))
    expect(await screen.findByText("Jane Doe's account was deleted.")).toBeInTheDocument()
  })

  it("disables Lock and Delete on the signed-in admin's own row", async () => {
    server.use(
      http.get(`${API_BASE_URL}/admin/users`, () =>
        HttpResponse.json({ success: true, data: USERS, meta: { page: 1, limit: 20, total: 2, totalPages: 1 } }),
      ),
    )

    renderPage()
    await screen.findByText('Admin User')

    const adminRow = findRow('Admin User')
    expect(adminRow.getByRole('button', { name: 'Lock' })).toBeDisabled()
    expect(adminRow.getByRole('button', { name: 'Delete' })).toBeDisabled()
  })
})
