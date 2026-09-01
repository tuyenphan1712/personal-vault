import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Profile } from '../types/profile.types'
import { ProfileDetail } from './ProfileDetail'

const PROFILE: Profile = {
  id: 'u1',
  phone: '0900000001',
  fullName: 'Jane Doe',
  role: 'member',
  status: 'active',
  birthday: '1990-01-01',
}

describe('ProfileDetail', () => {
  it('renders the phone, full name, and formatted birthday', () => {
    render(<ProfileDetail profile={PROFILE} onEdit={vi.fn()} />)

    expect(screen.getByText('0900000001')).toBeInTheDocument()
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('January 1, 1990')).toBeInTheDocument()
  })

  it('renders a placeholder when birthday is null', () => {
    render(<ProfileDetail profile={{ ...PROFILE, birthday: null }} onEdit={vi.fn()} />)

    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('calls onEdit when the edit button is clicked', async () => {
    const onEdit = vi.fn()
    render(<ProfileDetail profile={PROFILE} onEdit={onEdit} />)

    await userEvent.click(screen.getByRole('button', { name: 'Edit profile' }))

    expect(onEdit).toHaveBeenCalledOnce()
  })
})
