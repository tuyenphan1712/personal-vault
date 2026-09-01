import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { createQueryClientWrapper } from '@/test/QueryClientWrapper'
import { server } from '@/test/msw/server'
import { DocumentUploadForm } from './DocumentUploadForm'

function renderForm(onSuccess = vi.fn()) {
  const Wrapper = createQueryClientWrapper()
  return {
    onSuccess,
    ...render(
      <Wrapper>
        <DocumentUploadForm onSuccess={onSuccess} />
      </Wrapper>,
    ),
  }
}

async function selectFile(file: File) {
  const input = screen.getByLabelText('File') as HTMLInputElement
  // `applyAccept: false` because the input's `accept` attribute is a UI hint only — the real
  // validation lives in the Zod schema, and this test deliberately exercises rejected file types.
  await userEvent.setup({ applyAccept: false }).upload(input, file)
}

/**
 * jsdom's `File` isn't recognized by undici's strict multipart parser used internally by
 * MSW/Node's fetch runtime, so `request.formData()` throws when a real `File` is part of the
 * body (a test-environment limitation, not an app bug). Reading the raw multipart body as text
 * and pulling out each part's value works around it while still verifying what was actually sent.
 */
function getMultipartField(body: string, name: string): string | undefined {
  const match = body.match(new RegExp(`name="${name}"\\r?\\n\\r?\\n([^\\r\\n]*)`))
  return match?.[1]
}

describe('DocumentUploadForm', () => {
  it('renders the title, docType picker, and file fields', () => {
    renderForm()

    expect(screen.getByLabelText('Title')).toBeInTheDocument()
    expect(screen.getByLabelText('Document type (optional)')).toBeInTheDocument()
    expect(screen.getByLabelText('File')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Upload document' })).toBeInTheDocument()
  })

  it('lists every docType picker category plus a free-typed Other option', () => {
    renderForm()

    const select = screen.getByLabelText('Document type (optional)')
    expect(screen.getByRole('option', { name: 'Identity & Civil Status' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Education & Qualifications' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Employment & Contracts' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Medical & Health' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Finance & Tax' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Property & Vehicles' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Legal & Miscellaneous' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Other (custom)' })).toBeInTheDocument()
    expect(select).toBeInTheDocument()
  })

  it('shows a validation error when the title is missing', async () => {
    renderForm()
    const file = new File(['bytes'], 'doc.png', { type: 'image/png' })
    await selectFile(file)

    await userEvent.click(screen.getByRole('button', { name: 'Upload document' }))

    expect(await screen.findByText('Title is required')).toBeInTheDocument()
  })

  it('shows a validation error when no file is selected', async () => {
    renderForm()
    await userEvent.type(screen.getByLabelText('Title'), 'Passport')

    await userEvent.click(screen.getByRole('button', { name: 'Upload document' }))

    expect(await screen.findByText('A file is required')).toBeInTheDocument()
  })

  it('shows a validation error when the file exceeds the 10MB limit', async () => {
    renderForm()
    await userEvent.type(screen.getByLabelText('Title'), 'Big scan')
    const oversizedFile = new File(['bytes'], 'big.png', { type: 'image/png' })
    Object.defineProperty(oversizedFile, 'size', { value: 11 * 1024 * 1024 })
    await selectFile(oversizedFile)

    await userEvent.click(screen.getByRole('button', { name: 'Upload document' }))

    expect(await screen.findByText('File must be 10MB or smaller')).toBeInTheDocument()
  })

  it('shows a validation error when the file type is unsupported', async () => {
    renderForm()
    await userEvent.type(screen.getByLabelText('Title'), 'Random file')
    const badFile = new File(['bytes'], 'notes.txt', { type: 'text/plain' })
    await selectFile(badFile)

    await userEvent.click(screen.getByRole('button', { name: 'Upload document' }))

    expect(await screen.findByText('Only JPEG, PNG, or PDF files are allowed')).toBeInTheDocument()
  })

  it('reveals a free-text input when "Other (custom)" is selected and requires a value', async () => {
    renderForm()
    await userEvent.type(screen.getByLabelText('Title'), 'Something else')
    await selectFile(new File(['bytes'], 'doc.pdf', { type: 'application/pdf' }))
    await userEvent.selectOptions(screen.getByLabelText('Document type (optional)'), '__other__')

    expect(screen.getByLabelText('Other document type')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Upload document' }))

    expect(await screen.findByText('Please enter a document type')).toBeInTheDocument()
  })

  it('submits a valid upload with a picker docType and calls onSuccess', async () => {
    let capturedBody = ''
    server.use(
      http.post(`${API_BASE_URL}/documents`, async ({ request }) => {
        capturedBody = await request.text()
        return HttpResponse.json(
          {
            success: true,
            data: {
              id: 'd1',
              title: 'Passport front page',
              docType: 'identity_civil_status',
              mimeType: 'image/png',
              fileSize: 1234,
              createdAt: '2026-01-01T00:00:00Z',
              updatedAt: '2026-01-01T00:00:00Z',
            },
            meta: null,
          },
          { status: 201 },
        )
      }),
    )

    const { onSuccess } = renderForm()
    await userEvent.type(screen.getByLabelText('Title'), 'Passport front page')
    await userEvent.selectOptions(screen.getByLabelText('Document type (optional)'), 'identity_civil_status')
    await selectFile(new File(['bytes'], 'passport.png', { type: 'image/png' }))

    await userEvent.click(screen.getByRole('button', { name: 'Upload document' }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith('Document uploaded.'))
    expect(getMultipartField(capturedBody, 'title')).toBe('Passport front page')
    expect(getMultipartField(capturedBody, 'docType')).toBe('identity_civil_status')
    expect(capturedBody).toMatch(/name="file"; filename="[^"]*"/)
  })

  it('submits a valid upload with a custom "Other" docType', async () => {
    let capturedBody = ''
    server.use(
      http.post(`${API_BASE_URL}/documents`, async ({ request }) => {
        capturedBody = await request.text()
        return HttpResponse.json(
          {
            success: true,
            data: {
              id: 'd2',
              title: 'Warranty card',
              docType: 'Warranty',
              mimeType: 'application/pdf',
              fileSize: 999,
              createdAt: '2026-01-01T00:00:00Z',
              updatedAt: '2026-01-01T00:00:00Z',
            },
            meta: null,
          },
          { status: 201 },
        )
      }),
    )

    const { onSuccess } = renderForm()
    await userEvent.type(screen.getByLabelText('Title'), 'Warranty card')
    await userEvent.selectOptions(screen.getByLabelText('Document type (optional)'), '__other__')
    await userEvent.type(screen.getByLabelText('Other document type'), 'Warranty')
    await selectFile(new File(['bytes'], 'warranty.pdf', { type: 'application/pdf' }))

    await userEvent.click(screen.getByRole('button', { name: 'Upload document' }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith('Document uploaded.'))
    expect(getMultipartField(capturedBody, 'docType')).toBe('Warranty')
  })
})
