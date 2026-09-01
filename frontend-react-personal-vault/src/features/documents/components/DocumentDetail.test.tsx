import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { server } from '@/test/msw/server'
import type { Document } from '../types/document.types'
import { DocumentDetail } from './DocumentDetail'

const DOCUMENT: Document = {
  id: 'd1',
  title: 'Passport front page',
  docType: 'identity_civil_status',
  mimeType: 'image/png',
  fileSize: 482113,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

describe('DocumentDetail', () => {
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

  it('renders the title, translated docType, size, mime type, and upload date', () => {
    render(<DocumentDetail document={DOCUMENT} />)

    expect(screen.getByRole('heading', { name: 'Passport front page' })).toBeInTheDocument()
    expect(screen.getByText('Identity & Civil Status')).toBeInTheDocument()
    expect(screen.getByText('471 KB')).toBeInTheDocument()
    expect(screen.getByText('image/png')).toBeInTheDocument()
  })

  it('renders without a docType line when docType is null', () => {
    render(<DocumentDetail document={{ ...DOCUMENT, docType: null }} />)

    expect(screen.queryByText('Identity & Civil Status')).not.toBeInTheDocument()
  })

  it('triggers a download when the Download button is clicked', async () => {
    server.use(
      http.get(`${API_BASE_URL}/documents/:id/download`, ({ params }) => {
        expect(params.id).toBe('d1')
        return new HttpResponse(new Blob(['bytes'], { type: 'image/png' }))
      }),
    )

    render(<DocumentDetail document={DOCUMENT} />)

    await userEvent.click(screen.getByRole('button', { name: 'Download' }))

    await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled())
  })
})
