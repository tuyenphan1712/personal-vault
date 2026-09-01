import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react-native'
import type { ReactNode } from 'react'
import { server } from '@/src/shared/testing/msw/server'
import { createTestQueryClient } from '@/src/shared/testing/queryClient'
import { useCredentials } from '../useCredentials'
import { credentialFixture, listCredentialsNetworkErrorHandler, listCredentialsSuccessHandler } from './mocks/credentialHandlers'

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = createTestQueryClient()
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('useCredentials', () => {
  it('returns a loading state initially', async () => {
    server.use(listCredentialsSuccessHandler)
    const { result } = await renderHook(() => useCredentials(), { wrapper })

    expect(result.current.isLoading).toBe(true)
  })

  it('returns the credential list on success', async () => {
    server.use(listCredentialsSuccessHandler)
    const { result } = await renderHook(() => useCredentials(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.data).toEqual([credentialFixture])
  })

  it('returns an error on network failure', async () => {
    server.use(listCredentialsNetworkErrorHandler)
    const { result } = await renderHook(() => useCredentials(), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
