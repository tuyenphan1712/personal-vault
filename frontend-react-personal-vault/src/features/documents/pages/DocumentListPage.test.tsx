import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { useAuthStore } from '@/features/auth'
import { createQueryClientWrapper } from '@/test/QueryClientWrapper'
import { server } from '@/test/msw/server'
import { DocumentListPage } from './DocumentListPage'

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

function renderPage() {
  useAuthStore.setState({
    user: { id: USER_ID, phone: '0900000000', fullName: 'Jane Doe', role: 'member' },
    isAuthenticated: true,
    isSessionLoading: false,
  })

  const Wrapper = createQueryClientWrapper()
  return render(
    <MemoryRouter>
      <Wrapper>
        <DocumentListPage />
      </Wrapper>
    </MemoryRouter>,
  )
}

describe('DocumentListPage', () => {
  afterEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false, isSessionLoading: false })
  })

  it('renders the page title and fetched documents', async () => {
    server.use(
      http.get(`${API_BASE_URL}/documents`, () =>
        HttpResponse.json({ success: true, data: [DOCUMENT], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } }),
      ),
    )

    renderPage()

    expect(screen.getByRole('heading', { name: 'Documents' })).toBeInTheDocument()
    expect(await screen.findByText('Passport front page')).toBeInTheDocument()
  })

  it('renders the empty state when there are no documents', async () => {
    server.use(
      http.get(`${API_BASE_URL}/documents`, () =>
        HttpResponse.json({ success: true, data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } }),
      ),
    )

    renderPage()

    expect(await screen.findByText('No documents yet')).toBeInTheDocument()
  })

  it('opens the upload modal, uploads a document, and shows a success toast', async () => {
    server.use(
      http.get(`${API_BASE_URL}/documents`, () =>
        HttpResponse.json({ success: true, data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } }),
      ),
    )
    server.use(
      http.post(`${API_BASE_URL}/documents`, () =>
        HttpResponse.json({ success: true, data: DOCUMENT, meta: null }, { status: 201 }),
      ),
    )

    renderPage()
    await screen.findByText('No documents yet')

    await userEvent.click(screen.getByRole('button', { name: 'Upload document' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Title'), 'Passport front page')
    const file = new File(['bytes'], 'passport.png', { type: 'image/png' })
    await userEvent.upload(screen.getByLabelText('File'), file)

    const dialog = screen.getByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Upload document' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(await screen.findByText('Document uploaded.')).toBeInTheDocument()
  })
})
