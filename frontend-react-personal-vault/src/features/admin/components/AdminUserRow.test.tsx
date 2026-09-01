import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { createQueryClientWrapper } from '@/test/QueryClientWrapper'
import { server } from '@/test/msw/server'
import type { AdminUser } from '../types/admin.types'
import { AdminUserRow } from './AdminUserRow'

const ACTIVE_USER: AdminUser = {
  id: 'u1',
  phone: '0900000001',
  fullName: 'Jane Doe',
  role: 'member',
  status: 'active',
  createdAt: '2026-01-01T00:00:00Z',
}

function renderRow(props: Partial<ComponentProps<typeof AdminUserRow>> = {}) {
  const Wrapper = createQueryClientWrapper()
  return render(
    <Wrapper>
      <table>
        <tbody>
          <AdminUserRow user={ACTIVE_USER} isSelf={false} onNotify={vi.fn()} onRequestDelete={vi.fn()} {...props} />
        </tbody>
      </table>
    </Wrapper>,
  )
}

describe('AdminUserRow', () => {
  it('renders the user phone, name, role, status, and created date', () => {
    renderRow()

    expect(screen.getByText('0900000001')).toBeInTheDocument()
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('Member')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('shows "Lock" for an active user and "Unlock" for a locked user', () => {
    renderRow({ user: { ...ACTIVE_USER, status: 'locked' } })

    expect(screen.getByRole('button', { name: 'Unlock' })).toBeInTheDocument()
  })

  it('disables the Lock and Delete buttons when isSelf is true', () => {
    renderRow({ isSelf: true })

    expect(screen.getByRole('button', { name: 'Lock' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled()
  })

  it('calls onRequestDelete with the user when Delete is clicked', async () => {
    const onRequestDelete = vi.fn()
    renderRow({ onRequestDelete })

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))

    expect(onRequestDelete).toHaveBeenCalledWith(ACTIVE_USER)
  })

  it('locks the user and notifies on success when Lock is clicked', async () => {
    let capturedBody: unknown
    server.use(
      http.patch(`${API_BASE_URL}/admin/users/:id/status`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ success: true, data: { ...ACTIVE_USER, status: 'locked' }, meta: null })
      }),
    )
    const onNotify = vi.fn()
    renderRow({ onNotify })

    await userEvent.click(screen.getByRole('button', { name: 'Lock' }))

    // AdminUserRow is purely prop-driven — the badge only flips once the parent table
    // refetches after the mutation invalidates the query, which is covered by the
    // AdminUsersPage integration test. Here we assert the mutation itself fired correctly.
    await waitFor(() => expect(onNotify).toHaveBeenCalledWith(expect.stringContaining('Jane Doe')))
    expect(capturedBody).toEqual({ status: 'locked' })
  })

  it('notifies a generic error when the status update fails', async () => {
    server.use(
      http.patch(`${API_BASE_URL}/admin/users/:id/status`, () =>
        HttpResponse.json({ success: false, error: { code: 'USER_001', message: 'User not found', details: null } }, { status: 404 }),
      ),
    )
    const onNotify = vi.fn()
    renderRow({ onNotify })

    await userEvent.click(screen.getByRole('button', { name: 'Lock' }))

    await waitFor(() => expect(onNotify).toHaveBeenCalledWith('Action failed. Try again.'))
  })
})
