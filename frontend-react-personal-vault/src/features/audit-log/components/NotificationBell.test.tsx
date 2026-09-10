import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { createQueryClientWrapper } from '@/test/QueryClientWrapper'
import { server } from '@/test/msw/server'
import { NotificationBell } from './NotificationBell'

const ENTRY = {
  id: 'a1',
  action: 'CREDENTIAL_DELETED',
  targetLabel: 'Gmail',
  createdAt: '2026-01-01T00:00:00Z',
  readAt: null,
}

function mockAuditLogEndpoints(unreadCount: number) {
  server.use(
    http.get(`${API_BASE_URL}/audit-logs/unread-count`, () =>
      HttpResponse.json({ success: true, data: { count: unreadCount }, meta: null }),
    ),
    http.get(`${API_BASE_URL}/audit-logs`, () =>
      HttpResponse.json({ success: true, data: [ENTRY], meta: { page: 1, limit: 5, total: 1, totalPages: 1 } }),
    ),
  )
}

function renderBell() {
  const Wrapper = createQueryClientWrapper()
  return render(
    <MemoryRouter>
      <Wrapper>
        <NotificationBell />
      </Wrapper>
    </MemoryRouter>,
  )
}

describe('NotificationBell', () => {
  it('shows the unread count badge when there are unread entries', async () => {
    mockAuditLogEndpoints(3)

    renderBell()

    expect(await screen.findByText('3', { selector: 'span' })).toBeInTheDocument()
  })

  it('shows no badge when there are no unread entries', async () => {
    mockAuditLogEndpoints(0)

    renderBell()

    await waitFor(() => expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument())
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('marks all as read when opened with unread entries', async () => {
    mockAuditLogEndpoints(2)
    let markAllReadCalled = false
    server.use(
      http.patch(`${API_BASE_URL}/audit-logs/read-all`, () => {
        markAllReadCalled = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderBell()
    await screen.findByText('2', { selector: 'span' })
    await userEvent.click(screen.getByRole('button', { name: 'Notifications' }))

    await waitFor(() => expect(markAllReadCalled).toBe(true))
    expect(await screen.findByText('· Gmail')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View all activity' })).toBeInTheDocument()
  })
})
