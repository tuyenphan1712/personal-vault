import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PasswordStrengthMeter } from './PasswordStrengthMeter'

describe('PasswordStrengthMeter', () => {
  it('renders nothing when the password is empty', () => {
    const { container } = render(<PasswordStrengthMeter password="" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the weak hint in the danger color for a weak password', () => {
    render(<PasswordStrengthMeter password="abc" />)
    const hint = screen.getByText('Weak password')
    expect(hint).toHaveClass('text-danger')
  })

  it('shows the medium hint in the warning color for a medium password', () => {
    render(<PasswordStrengthMeter password="abcdefghij1" />)
    const hint = screen.getByText('Medium password')
    expect(hint).toHaveClass('text-warning')
  })

  it('shows the strong hint in the success color for a strong password', () => {
    render(<PasswordStrengthMeter password="abcdefghij1!" />)
    const hint = screen.getByText('Strong password')
    expect(hint).toHaveClass('text-success')
  })
})
