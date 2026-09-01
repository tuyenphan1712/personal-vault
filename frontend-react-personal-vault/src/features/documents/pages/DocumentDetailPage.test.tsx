import { render, screen } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { useAuthStore } from '@/features/auth'
import { createQueryClientWrapper } from '@/test/QueryClientWrapper'
import { server } from '@/test/msw/server'
import { DocumentDetailPage } from './DocumentDetailPage'

const USER_ID = 'user-1'
const DOCUMENT = {
  id: 'd1',
  title: 'Passport front page',
  docType: 'identity_civil_status',
  mimeType: 'image/png',
  fileSize: 482113,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

function renderPage(id: string) {
  useAuthStore.setState({
    user: { id: USER_ID, phone: '0900000000', fullName: 'Jane Doe', role: 'member' },
    isAuthenticated: true,
    isSessionLoading: false,
  })

  const Wrapper = createQueryClientWrapper()
  return render(
    <MemoryRouter initialEntries={[`/documents/${id}`]}>
      <Wrapper>
        <Routes>
          <Route path="/documents/:id" element={<DocumentDetailPage />} />
        </Routes>
      </Wrapper>
    </MemoryRouter>,
  )
}

describe('DocumentDetailPage', () => {
  afterEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false, isSessionLoading: false })
  })

  it('renders a loading state, then the document metadata on success', async () => {
    server.use(http.get(`${API_BASE_URL}/documents/:id`, () => HttpResponse.json({ success: true, data: DOCUMENT, meta: null })))

    renderPage('d1')

    expect(screen.getByText('Loading…')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Passport front page' })).toBeInTheDocument()
  })

  it('shows a not-found message instead of crashing when the document does not exist (404)', async () => {
    server.use(
      http.get(`${API_BASE_URL}/documents/:id`, () =>
        HttpResponse.json({ success: false, error: { code: 'DOCUMENT_001', message: 'Document not found', details: null } }, { status: 404 }),
      ),
    )

    renderPage('missing')

    expect(await screen.findByText('Document not found.')).toBeInTheDocument()
  })

  it('shows a not-found message instead of crashing when access is denied (403 for another user\'s document)', async () => {
    server.use(
      http.get(`${API_BASE_URL}/documents/:id`, () =>
        HttpResponse.json({ success: false, error: { code: 'DOCUMENT_001', message: 'Document not found', details: null } }, { status: 403 }),
      ),
    )

    renderPage('not-mine')

    expect(await screen.findByText('Document not found.')).toBeInTheDocument()
  })
})
