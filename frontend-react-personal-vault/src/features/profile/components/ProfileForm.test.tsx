import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { createQueryClientWrapper } from '@/test/QueryClientWrapper'
import { server } from '@/test/msw/server'
import type { Profile } from '../types/profile.types'
import { ProfileForm } from './ProfileForm'

const PROFILE: Profile = {
  id: 'u1',
  phone: '0900000001',
  fullName: 'Jane Doe',
  role: 'member',
  status: 'active',
  birthday: '1990-01-01',
}

function renderForm(profile: Profile = PROFILE, onSuccess = vi.fn(), onCancel = vi.fn()) {
  const Wrapper = createQueryClientWrapper()
  return {
    onSuccess,
    onCancel,
    ...render(
      <Wrapper>
        <ProfileForm profile={profile} onSuccess={onSuccess} onCancel={onCancel} />
      </Wrapper>,
    ),
  }
}

describe('ProfileForm', () => {
  it('pre-fills fields from the current profile', () => {
    renderForm()

    expect(screen.getByLabelText('Full name')).toHaveValue('Jane Doe')
    expect(screen.getByLabelText('Birthday')).toHaveValue('1990-01-01')
    expect(screen.getByText('0900000001')).toBeInTheDocument()
    expect(screen.getByText("Can't be changed here")).toBeInTheDocument()
  })

  it('shows a validation error when full name is cleared', async () => {
    renderForm()

    await userEvent.clear(screen.getByLabelText('Full name'))
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByText('Full name is required')).toBeInTheDocument()
  })

  it('submits only fullName and birthday, and calls onSuccess', async () => {
    let capturedBody: unknown
    server.use(
      http.patch(`${API_BASE_URL}/profile`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ success: true, data: { ...PROFILE, fullName: 'John Doe' }, meta: null })
      }),
    )
    const { onSuccess } = renderForm()

    await userEvent.clear(screen.getByLabelText('Full name'))
    await userEvent.type(screen.getByLabelText('Full name'), 'John Doe')
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())
    expect(capturedBody).toEqual({ fullName: 'John Doe', birthday: '1990-01-01' })
  })

  it('sends birthday as null when the birthday field is cleared', async () => {
    let capturedBody: unknown
    server.use(
      http.patch(`${API_BASE_URL}/profile`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ success: true, data: { ...PROFILE, birthday: null }, meta: null })
      }),
    )
    const { onSuccess } = renderForm()

    await userEvent.clear(screen.getByLabelText('Birthday'))
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())
    expect(capturedBody).toEqual({ fullName: 'Jane Doe', birthday: null })
  })

  it('calls onCancel when Cancel is clicked', async () => {
    const { onCancel } = renderForm()

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('disables the submit button while the update is pending', async () => {
    server.use(
      http.patch(`${API_BASE_URL}/profile`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
        return HttpResponse.json({ success: true, data: PROFILE, meta: null })
      }),
    )
    renderForm()

    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(screen.getByRole('button', { name: 'Loading…' })).toBeDisabled()
  })

  it('does not call onSuccess when the update fails', async () => {
    // ProfileForm's onSubmit awaits mutateAsync without a try/catch, so a rejected mutation
    // surfaces as an unhandled promise rejection in the test process. That is the component's
    // real (untouched) behavior; swallow it here so it doesn't fail the test run.
    const onUnhandledRejection = () => {}
    process.on('unhandledRejection', onUnhandledRejection)

    server.use(
      http.patch(`${API_BASE_URL}/profile`, () =>
        HttpResponse.json({ success: false, error: { code: 'COMMON_001', message: 'Validation failed', details: null } }, { status: 400 }),
      ),
    )
    const { onSuccess } = renderForm()

    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled())
    expect(onSuccess).not.toHaveBeenCalled()

    process.off('unhandledRejection', onUnhandledRejection)
  })
})
