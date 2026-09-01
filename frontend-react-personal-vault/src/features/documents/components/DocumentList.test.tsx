import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { createQueryClientWrapper } from '@/test/QueryClientWrapper'
import { server } from '@/test/msw/server'
import { DocumentList } from './DocumentList'

const DOCUMENT = {
  id: 'd1',
  title: 'Passport front page',
  docType: 'identity_civil_status',
  mimeType: 'image/png',
  fileSize: 482113,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

function mockDocumentsEndpoint(handler: Parameters<typeof http.get>[1]) {
  server.use(http.get(`${API_BASE_URL}/documents`, handler))
}

function renderList(onNotify = vi.fn()) {
  const Wrapper = createQueryClientWrapper()
  return {
    onNotify,
    ...render(
      <MemoryRouter>
        <Wrapper>
          <DocumentList onNotify={onNotify} />
        </Wrapper>
      </MemoryRouter>,
    ),
  }
}

describe('DocumentList', () => {
  it('renders a loading state', () => {
    mockDocumentsEndpoint(() => new Promise(() => {}))

    renderList()

    expect(screen.getByText('Loading documents…')).toBeInTheDocument()
  })

  it('renders an error state when the request fails', async () => {
    mockDocumentsEndpoint(() =>
      HttpResponse.json({ success: false, error: { code: 'AUTH_005', message: 'Unauthorized', details: null } }, { status: 401 }),
    )

    renderList()

    expect(await screen.findByText("Couldn't load your documents. Try again.")).toBeInTheDocument()
  })

  it('renders an empty state when there are no documents', async () => {
    mockDocumentsEndpoint(() =>
      HttpResponse.json({ success: true, data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } }),
    )

    renderList()

    expect(await screen.findByText('No documents yet')).toBeInTheDocument()
    expect(screen.getByText('Upload your first private document to get started.')).toBeInTheDocument()
  })

  it('renders the list of documents with the translated docType label', async () => {
    mockDocumentsEndpoint(() =>
      HttpResponse.json({ success: true, data: [DOCUMENT], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } }),
    )

    renderList()

    expect(await screen.findByText('Passport front page')).toBeInTheDocument()
    expect(screen.getByText('Identity & Civil Status')).toBeInTheDocument()
    expect(screen.queryByText('identity_civil_status')).not.toBeInTheDocument()
    expect(screen.getByText('1 document')).toBeInTheDocument()
  })

  it('deletes a document and notifies on success', async () => {
    mockDocumentsEndpoint(() =>
      HttpResponse.json({ success: true, data: [DOCUMENT], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } }),
    )
    let deleteCalled = false
    server.use(
      http.delete(`${API_BASE_URL}/documents/:id`, ({ params }) => {
        deleteCalled = true
        expect(params.id).toBe('d1')
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const { onNotify } = renderList()
    await screen.findByText('Passport front page')

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(onNotify).toHaveBeenCalledWith('Passport front page deleted.'))
    expect(deleteCalled).toBe(true)
  })
})
