import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { createQueryClientWrapper } from '@/test/QueryClientWrapper'
import { server } from '@/test/msw/server'
import type { Document } from '../types/document.types'
import { DocumentCard } from './DocumentCard'

const DOCUMENT: Document = {
  id: 'd1',
  title: 'Passport front page',
  docType: 'identity_civil_status',
  mimeType: 'image/png',
  fileSize: 482113,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

function renderCard(document = DOCUMENT, onNotify = vi.fn()) {
  const Wrapper = createQueryClientWrapper()
  return {
    onNotify,
    ...render(
      <MemoryRouter>
        <Wrapper>
          <ul>
            <DocumentCard document={document} onNotify={onNotify} />
          </ul>
        </Wrapper>
      </MemoryRouter>,
    ),
  }
}

describe('DocumentCard', () => {
  beforeEach(() => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = originalCreateElement(tagName)
      if (tagName === 'a') {
        el.click = vi.fn()
      }
      return el
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the title, translated docType, size, and date', () => {
    renderCard()

    expect(screen.getByText('Passport front page')).toBeInTheDocument()
    expect(screen.getByText('Identity & Civil Status')).toBeInTheDocument()
    expect(screen.queryByText('identity_civil_status')).not.toBeInTheDocument()
    expect(screen.getByText('471 KB')).toBeInTheDocument()
  })

  it('does not render a docType tag when docType is null', () => {
    renderCard({ ...DOCUMENT, docType: null })

    expect(screen.queryByText('Identity & Civil Status')).not.toBeInTheDocument()
  })

  it('falls back to the raw value for a free-typed docType', () => {
    renderCard({ ...DOCUMENT, docType: 'Warranty' })

    expect(screen.getByText('Warranty')).toBeInTheDocument()
  })

  it('links the title to the document detail page', () => {
    renderCard()

    expect(screen.getByRole('link', { name: 'Passport front page' })).toHaveAttribute('href', '/documents/d1')
  })

  it('deletes the document and notifies on success', async () => {
    let deleteCalled = false
    server.use(
      http.delete(`${API_BASE_URL}/documents/:id`, ({ params }) => {
        deleteCalled = true
        expect(params.id).toBe('d1')
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { onNotify } = renderCard()

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(onNotify).toHaveBeenCalledWith('Passport front page deleted.'))
    expect(deleteCalled).toBe(true)
  })

  it('downloads the document when Download is clicked', async () => {
    server.use(
      http.get(`${API_BASE_URL}/documents/:id/download`, ({ params }) => {
        expect(params.id).toBe('d1')
        return new HttpResponse(new Blob(['bytes'], { type: 'image/png' }))
      }),
    )
    renderCard()

    await userEvent.click(screen.getByRole('button', { name: 'Download' }))

    await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled())
  })
})
