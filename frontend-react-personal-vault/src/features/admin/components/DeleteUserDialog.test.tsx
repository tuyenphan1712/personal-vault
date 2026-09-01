import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { AdminUser } from '../types/admin.types'
import { DeleteUserDialog } from './DeleteUserDialog'

const USER: AdminUser = {
  id: 'u1',
  phone: '0900000001',
  fullName: 'Jane Doe',
  role: 'member',
  status: 'active',
  createdAt: '2026-01-01T00:00:00Z',
}

describe('DeleteUserDialog', () => {
  it('renders nothing when there is no user to delete', () => {
    render(<DeleteUserDialog user={null} isDeleting={false} onConfirm={vi.fn()} onCancel={vi.fn()} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows the user name and phone in the confirmation body', () => {
    render(<DeleteUserDialog user={USER} isDeleting={false} onConfirm={vi.fn()} onCancel={vi.fn()} />)

    expect(screen.getByRole('dialog')).toHaveTextContent('Jane Doe')
    expect(screen.getByRole('dialog')).toHaveTextContent('0900000001')
  })

  it('calls onCancel when Cancel is clicked', async () => {
    const onCancel = vi.fn()
    render(<DeleteUserDialog user={USER} isDeleting={false} onConfirm={vi.fn()} onCancel={onCancel} />)

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('calls onConfirm when the delete confirmation button is clicked', async () => {
    const onConfirm = vi.fn()
    render(<DeleteUserDialog user={USER} isDeleting={false} onConfirm={onConfirm} onCancel={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: 'Delete account' }))

    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('disables the confirm button while deleting', () => {
    render(<DeleteUserDialog user={USER} isDeleting={true} onConfirm={vi.fn()} onCancel={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Loading…' })).toBeDisabled()
  })
})
