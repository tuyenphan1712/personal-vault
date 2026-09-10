import { QueryClientProvider } from '@tanstack/react-query'
import { screen, waitFor } from '@testing-library/react-native'
import { renderWithProviders } from '@/src/shared/testing/renderWithProviders'
import { server } from '@/src/shared/testing/msw/server'
import { createTestQueryClient } from '@/src/shared/testing/queryClient'
import { NotificationsScreen } from '../NotificationsScreen'
import {
  listAuditLogsNetworkErrorHandler,
  listAuditLogsSuccessHandler,
  markAllReadSuccessHandler,
} from '../../hooks/__tests__/mocks/auditLogHandlers'

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn(), back: jest.fn() }) }))

function renderScreen() {
  const queryClient = createTestQueryClient()
  return renderWithProviders(
    <QueryClientProvider client={queryClient}>
      <NotificationsScreen />
    </QueryClientProvider>,
  )
}

describe('NotificationsScreen', () => {
  it('fetches and displays entries, and marks them read', async () => {
    server.use(listAuditLogsSuccessHandler, markAllReadSuccessHandler)
    await renderScreen()

    expect(await screen.findByText(/Credential deleted/)).toBeTruthy()
  })

  it('shows an offline-friendly message on a network error', async () => {
    server.use(listAuditLogsNetworkErrorHandler, markAllReadSuccessHandler)
    await renderScreen()

    await waitFor(() => expect(screen.getByText(/offline/i)).toBeTruthy())
  })
})
