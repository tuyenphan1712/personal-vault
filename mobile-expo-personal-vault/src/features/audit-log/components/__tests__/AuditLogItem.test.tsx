import { screen } from '@testing-library/react-native'
import { renderWithProviders } from '@/src/shared/testing/renderWithProviders'
import { AuditLogItem } from '../AuditLogItem'
import { auditLogFixture } from '../../hooks/__tests__/mocks/auditLogHandlers'

describe('AuditLogItem', () => {
  it('renders the action label and target', async () => {
    await renderWithProviders(<AuditLogItem entry={auditLogFixture} />)

    expect(screen.getAllByText(/Credential deleted/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Gmail/).length).toBeGreaterThan(0)
  })
})
