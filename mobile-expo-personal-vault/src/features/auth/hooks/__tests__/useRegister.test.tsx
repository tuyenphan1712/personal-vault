import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react-native'
import type { ReactNode } from 'react'
import { server } from '@/src/shared/testing/msw/server'
import { createTestQueryClient } from '@/src/shared/testing/queryClient'
import { useRegister } from '../useRegister'
import { currentUserFixture, registerDuplicatePhoneHandler, registerSuccessHandler } from './mocks/authHandlers'

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = createTestQueryClient()
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('useRegister', () => {
  it('returns the created user on success', async () => {
    server.use(registerSuccessHandler)
    const { result } = await renderHook(() => useRegister(), { wrapper })

    result.current.mutate({ phone: '0900000000', password: 'a-strong-password', fullName: 'Nguyen Van A' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(currentUserFixture)
  })

  it('surfaces a duplicate-phone error', async () => {
    server.use(registerDuplicatePhoneHandler)
    const { result } = await renderHook(() => useRegister(), { wrapper })

    result.current.mutate({ phone: '0900000000', password: 'a-strong-password', fullName: 'Nguyen Van A' })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
