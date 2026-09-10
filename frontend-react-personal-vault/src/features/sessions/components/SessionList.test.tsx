import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { createQueryClientWrapper } from '@/test/QueryClientWrapper'
import { server } from '@/test/msw/server'
import { SessionList } from './SessionList'

const CURRENT_SESSION = {
  id: 's1',
  clientType: 'web',
  deviceInfo: 'Chrome on Windows',
  createdAt: '2026-01-01T00:00:00Z',
  expiresAt: '2026-02-01T00:00:00Z',
  isCurrent: true,
}

const OTHER_SESSION = {
  id: 's2',
  clientType: 'mobile',
  deviceInfo: null,
  createdAt: '2026-01-02T00:00:00Z',
  expiresAt: '2026-02-02T00:00:00Z',
  isCurrent: false,
}

function renderList() {
  const Wrapper = createQueryClientWrapper()
  return render(
    <Wrapper>
      <SessionList />
    </Wrapper>,
  )
}

describe('SessionList', () => {
  it('shows the empty state when there are no sessions', async () => {
    server.use(http.get(`${API_BASE_URL}/sessions`, () => HttpResponse.json({ success: true, data: [], meta: null })))

    renderList()

    expect(await screen.findByText('No active sessions.')).toBeInTheDocument()
  })

  it('shows an error message on failure', async () => {
    server.use(
      http.get(`${API_BASE_URL}/sessions`, () =>
        HttpResponse.json({ success: false, error: { code: 'AUTH_005', message: 'Unauthorized', details: null } }, { status: 401 }),
      ),
    )

    renderList()

    expect(await screen.findByText("Couldn't load your active sessions. Try again.")).toBeInTheDocument()
  })

  it('does not show a Revoke button for the current session, but does for others', async () => {
    server.use(
      http.get(`${API_BASE_URL}/sessions`, () =>
        HttpResponse.json({ success: true, data: [CURRENT_SESSION, OTHER_SESSION], meta: null }),
      ),
    )

    renderList()

    expect(await screen.findByText('· Chrome on Windows')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Revoke' })).toHaveLength(1)
  })

  it('revokes a session after confirming the dialog', async () => {
    server.use(
      http.get(`${API_BASE_URL}/sessions`, () =>
        HttpResponse.json({ success: true, data: [CURRENT_SESSION, OTHER_SESSION], meta: null }),
      ),
    )
    let revokeCalled = false
    server.use(
      http.delete(`${API_BASE_URL}/sessions/:id`, ({ params }) => {
        revokeCalled = true
        expect(params.id).toBe('s2')
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderList()
    await screen.findByText('· Chrome on Windows')

    await userEvent.click(screen.getByRole('button', { name: 'Revoke' }))
    const dialog = screen.getByRole('dialog')

    await userEvent.click(within(dialog).getByRole('button', { name: 'Revoke' }))

    await waitFor(() => expect(revokeCalled).toBe(true))
  })
})
