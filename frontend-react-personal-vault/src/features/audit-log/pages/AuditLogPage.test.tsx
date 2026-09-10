import { render, screen } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { createQueryClientWrapper } from '@/test/QueryClientWrapper'
import { server } from '@/test/msw/server'
import { AuditLogPage } from './AuditLogPage'

const ENTRY = {
  id: 'a1',
  action: 'LOGIN_SUCCESS',
  targetLabel: null,
  createdAt: '2026-01-01T00:00:00Z',
  readAt: '2026-01-01T00:05:00Z',
}

function renderPage() {
  const Wrapper = createQueryClientWrapper()
  return render(
    <MemoryRouter>
      <Wrapper>
        <AuditLogPage />
      </Wrapper>
    </MemoryRouter>,
  )
}

describe('AuditLogPage', () => {
  it('renders the entries returned by the API', async () => {
    server.use(
      http.get(`${API_BASE_URL}/audit-logs`, () =>
        HttpResponse.json({ success: true, data: [ENTRY], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } }),
      ),
    )

    renderPage()

    expect(await screen.findByText('Signed in')).toBeInTheDocument()
  })

  it('shows the empty state when there is no activity', async () => {
    server.use(
      http.get(`${API_BASE_URL}/audit-logs`, () =>
        HttpResponse.json({ success: true, data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } }),
      ),
    )

    renderPage()

    expect(await screen.findByText('No activity yet')).toBeInTheDocument()
  })
})
