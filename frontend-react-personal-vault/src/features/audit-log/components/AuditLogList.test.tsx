import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { AuditLogEntry } from '../types/audit-log.types'
import { AuditLogList } from './AuditLogList'

const ENTRY: AuditLogEntry = {
  id: 'a1',
  action: 'CREDENTIAL_DELETED',
  targetLabel: 'Gmail',
  createdAt: '2026-01-01T00:00:00Z',
  readAt: null,
}

describe('AuditLogList', () => {
  it('shows a loading message while loading', () => {
    render(<AuditLogList entries={[]} isLoading isError={false} />)

    expect(screen.getByText('Loading activity…')).toBeInTheDocument()
  })

  it('shows an error message on failure', () => {
    render(<AuditLogList entries={[]} isLoading={false} isError />)

    expect(screen.getByText("Couldn't load your activity log. Try again.")).toBeInTheDocument()
  })

  it('shows an empty message when there are no entries', () => {
    render(<AuditLogList entries={[]} isLoading={false} isError={false} />)

    expect(screen.getByText('No activity yet')).toBeInTheDocument()
  })

  it('renders one item per entry with its action label and target', () => {
    render(<AuditLogList entries={[ENTRY]} isLoading={false} isError={false} />)

    expect(screen.getByText('Credential deleted')).toBeInTheDocument()
    expect(screen.getByText('· Gmail')).toBeInTheDocument()
  })
})
