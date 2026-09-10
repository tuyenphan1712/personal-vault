import { QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, screen, waitFor } from '@testing-library/react-native'
import { rest } from 'msw'
import { Alert } from 'react-native'
import { API_BASE_URL } from '@/src/config/constants'
import { renderWithProviders } from '@/src/shared/testing/renderWithProviders'
import { server } from '@/src/shared/testing/msw/server'
import { createTestQueryClient } from '@/src/shared/testing/queryClient'
import { SessionList } from '../SessionList'
import { listSessionsEmptyHandler, listSessionsSuccessHandler } from '../../hooks/__tests__/mocks/sessionHandlers'

function renderList() {
  const queryClient = createTestQueryClient()
  return renderWithProviders(
    <QueryClientProvider client={queryClient}>
      <SessionList />
    </QueryClientProvider>,
  )
}

describe('SessionList', () => {
  it('shows the empty state when there are no sessions', async () => {
    server.use(listSessionsEmptyHandler)
    await renderList()

    expect(await screen.findByText('No active sessions.')).toBeTruthy()
  })

  it('shows a Revoke button for a non-current session', async () => {
    server.use(listSessionsSuccessHandler)
    await renderList()

    expect(await screen.findByText('Chrome on Windows')).toBeTruthy()
    expect(screen.getByText('Revoke')).toBeTruthy()
  })

  it('confirms via Alert.alert and calls the revoke endpoint on confirm', async () => {
    let revokedId: string | undefined
    server.use(
      listSessionsSuccessHandler,
      rest.delete(`${API_BASE_URL}/sessions/:id`, (req, res, ctx) => {
        revokedId = req.params.id as string
        return res(ctx.status(204))
      }),
    )
    const alertSpy = jest.spyOn(Alert, 'alert')
    await renderList()
    await screen.findByText('Chrome on Windows')

    fireEvent.press(screen.getByText('Revoke'))

    expect(alertSpy).toHaveBeenCalled()
    const confirmButton = alertSpy.mock.calls[0][2]?.find((button) => button.style === 'destructive')
    confirmButton?.onPress?.()

    await waitFor(() => expect(revokedId).toBe('sess-1'))
  })
})
