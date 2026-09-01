import { act, renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { server } from '@/test/msw/server'
import { useDownloadDocument } from './useDownloadDocument'

describe('useDownloadDocument', () => {
  let createObjectURLSpy: ReturnType<typeof vi.fn>
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>
  let clickSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    clickSpy = vi.fn()
    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = originalCreateElement(tagName)
      if (tagName === 'a') {
        el.click = clickSpy
      }
      return el
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('downloads the document blob and triggers a same-tab save via a temporary object URL', async () => {
    server.use(
      http.get(`${API_BASE_URL}/documents/:id/download`, ({ params }) => {
        expect(params.id).toBe('d1')
        return new HttpResponse(new Blob(['file-content'], { type: 'image/png' }), {
          headers: { 'Content-Type': 'image/png' },
        })
      }),
    )

    const { result } = renderHook(() => useDownloadDocument())

    expect(result.current.isDownloading).toBe(false)

    await act(async () => {
      await result.current.download('d1', 'Passport.png')
    })

    expect(createObjectURLSpy).toHaveBeenCalledTimes(1)
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url')
    await waitFor(() => expect(result.current.isDownloading).toBe(false))
  })

  it('resets isDownloading even when the download request fails', async () => {
    server.use(
      http.get(`${API_BASE_URL}/documents/:id/download`, () =>
        HttpResponse.json({ success: false, error: { code: 'DOCUMENT_001', message: 'Document not found', details: null } }, { status: 404 }),
      ),
    )

    const { result } = renderHook(() => useDownloadDocument())

    await act(async () => {
      await expect(result.current.download('missing', 'file.png')).rejects.toBeTruthy()
    })

    expect(result.current.isDownloading).toBe(false)
    expect(clickSpy).not.toHaveBeenCalled()
  })
})
