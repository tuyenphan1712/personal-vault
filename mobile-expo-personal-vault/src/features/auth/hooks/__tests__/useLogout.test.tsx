import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react-native'
import type { ReactNode } from 'react'
import { server } from '@/src/shared/testing/msw/server'
import { createTestQueryClient } from '@/src/shared/testing/queryClient'
import { getAccessToken, setAccessToken } from '@/src/shared/lib/auth/tokenStore'
import { getEncryptionKey, setEncryptionKey } from '@/src/shared/lib/crypto/keyStore'
import { useAuthStore } from '../../stores/auth.store'
import { useLogout } from '../useLogout'
import { logoutSuccessHandler, VALID_REFRESH_TOKEN } from './mocks/authHandlers'
import { rest } from 'msw'
import { API_BASE_URL } from '@/src/config/constants'

jest.mock('@/src/shared/lib/storage/secureStorage', () => ({
  setRefreshToken: jest.fn().mockResolvedValue(undefined),
  getRefreshToken: jest.fn().mockResolvedValue('valid-refresh-token'),
  clearRefreshToken: jest.fn().mockResolvedValue(undefined),
}))

import { clearRefreshToken, getRefreshToken } from '@/src/shared/lib/storage/secureStorage'

let queryClient: QueryClient

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

beforeEach(() => {
  queryClient = createTestQueryClient()
  setAccessToken('some-access-token')
  setEncryptionKey(new Uint8Array(32).fill(1))
  useAuthStore.setState({
    user: { id: 'user-1', phone: VALID_REFRESH_TOKEN, fullName: 'Nguyen Van A', role: 'member' },
    isAuthenticated: true,
    isSessionLoading: false,
    isAppLocked: false,
  })
  jest.clearAllMocks()
})

describe('useLogout', () => {
  it('clears the access token, refresh token, session, and query cache on success', async () => {
    server.use(logoutSuccessHandler)
    const clearSpy = jest.spyOn(queryClient, 'clear')
    const { result } = await renderHook(() => useLogout(), { wrapper })

    result.current.mutate()

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(getAccessToken()).toBeNull()
    expect(getEncryptionKey()).toBeNull()
    expect(clearRefreshToken).toHaveBeenCalled()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(clearSpy).toHaveBeenCalled()
  })

  it('still clears all local session state even when the logout request fails', async () => {
    server.use(
      rest.post(`${API_BASE_URL}/auth/logout`, (_req, res, ctx) => res(ctx.status(500), ctx.json({}))),
    )
    const { result } = await renderHook(() => useLogout(), { wrapper })

    result.current.mutate()

    await waitFor(() => expect(result.current.isError || result.current.isSuccess).toBe(true))

    expect(getAccessToken()).toBeNull()
    expect(clearRefreshToken).toHaveBeenCalled()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('does not call the logout endpoint when there is no stored refresh token', async () => {
    ;(getRefreshToken as jest.Mock).mockResolvedValueOnce(null)
    let requestCount = 0
    server.use(
      rest.post(`${API_BASE_URL}/auth/logout`, (_req, res, ctx) => {
        requestCount += 1
        return res(ctx.status(204))
      }),
    )
    const { result } = await renderHook(() => useLogout(), { wrapper })

    result.current.mutate()

    await waitFor(() => expect(getAccessToken()).toBeNull())
    expect(requestCount).toBe(0)
  })
})
