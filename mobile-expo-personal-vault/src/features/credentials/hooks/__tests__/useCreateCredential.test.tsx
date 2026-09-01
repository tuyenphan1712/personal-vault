import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react-native'
import type { ReactNode } from 'react'
import { server } from '@/src/shared/testing/msw/server'
import { createTestQueryClient } from '@/src/shared/testing/queryClient'
import { useCreateCredential } from '../useCreateCredential'
import { credentialKeys } from '../credentialKeys'
import { createCredentialSuccessHandler } from './mocks/credentialHandlers'

let queryClient: QueryClient

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

beforeEach(() => {
  queryClient = createTestQueryClient()
})

describe('useCreateCredential', () => {
  it('calls the service with the encrypted payload on mutate', async () => {
    server.use(createCredentialSuccessHandler)
    const { result } = await renderHook(() => useCreateCredential(), { wrapper })

    result.current.mutate({
      platformName: 'Gmail',
      account: 'user@gmail.com',
      encryptedPassword: 'AAAAAAAAAAAAAAAA:ZmFrZS1jaXBoZXJ0ZXh0',
      note: null,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.platformName).toBe('Gmail')
    expect(result.current.data?.encryptedPassword).toBe('AAAAAAAAAAAAAAAA:ZmFrZS1jaXBoZXJ0ZXh0')
  })

  it('invalidates the credentials list query on success', async () => {
    server.use(createCredentialSuccessHandler)
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')
    const { result } = await renderHook(() => useCreateCredential(), { wrapper })

    result.current.mutate({
      platformName: 'Gmail',
      account: 'user@gmail.com',
      encryptedPassword: 'AAAAAAAAAAAAAAAA:ZmFrZS1jaXBoZXJ0ZXh0',
      note: null,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: credentialKeys.all })
  })
})
