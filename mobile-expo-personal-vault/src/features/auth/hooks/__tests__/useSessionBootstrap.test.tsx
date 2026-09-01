import { renderHook, waitFor } from '@testing-library/react-native'
import { server } from '@/src/shared/testing/msw/server'
import { getAccessToken, setAccessToken } from '@/src/shared/lib/auth/tokenStore'
import { registerAuthHandlers } from '@/src/shared/lib/api/axios'
import { useAuthStore } from '../../stores/auth.store'
import { useSessionBootstrap } from '../useSessionBootstrap'
import {
  currentUserFixture,
  getMeSuccessHandler,
  getMeUnauthorizedHandler,
  refreshSuccessHandler,
  VALID_REFRESH_TOKEN,
} from './mocks/authHandlers'

jest.mock('@/src/shared/lib/storage/secureStorage', () => ({
  setRefreshToken: jest.fn().mockResolvedValue(undefined),
  getRefreshToken: jest.fn().mockResolvedValue(null),
  clearRefreshToken: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/src/shared/lib/api/axios', () => {
  const actual = jest.requireActual('@/src/shared/lib/api/axios')
  return { ...actual, registerAuthHandlers: jest.fn(actual.registerAuthHandlers) }
})

import { getRefreshToken } from '@/src/shared/lib/storage/secureStorage'

let currentUnmount: (() => void) | undefined

async function renderBootstrap() {
  const { unmount } = await renderHook(() => useSessionBootstrap())
  currentUnmount = unmount
}

beforeEach(() => {
  setAccessToken(null)
  useAuthStore.setState({ user: null, isAuthenticated: false, isSessionLoading: true, isAppLocked: false })
  jest.clearAllMocks()
  ;(getRefreshToken as jest.Mock).mockResolvedValue(null)
})

afterEach(() => {
  currentUnmount?.()
  currentUnmount = undefined
})

describe('useSessionBootstrap', () => {
  it('registers the axios auth handlers exactly once', async () => {
    await renderBootstrap()
    await waitFor(() => expect(useAuthStore.getState().isSessionLoading).toBe(false))

    expect(registerAuthHandlers).toHaveBeenCalledTimes(1)
    expect(registerAuthHandlers).toHaveBeenCalledWith(
      expect.objectContaining({
        refreshAccessToken: expect.any(Function),
        handleSessionExpired: expect.any(Function),
      }),
    )
  })

  it('clears the session and stops loading when there is no stored refresh token', async () => {
    await renderBootstrap()

    await waitFor(() => expect(useAuthStore.getState().isSessionLoading).toBe(false))
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(getAccessToken()).toBeNull()
  })

  it('restores the session when the stored refresh token is valid', async () => {
    ;(getRefreshToken as jest.Mock).mockResolvedValue(VALID_REFRESH_TOKEN)
    server.use(refreshSuccessHandler, getMeSuccessHandler)

    await renderBootstrap()

    await waitFor(() => expect(useAuthStore.getState().isSessionLoading).toBe(false))
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(useAuthStore.getState().user).toEqual(currentUserFixture)
    expect(getAccessToken()).toBe('access-token-2')
  })

  it('clears the session when the stored refresh token is rejected by the server', async () => {
    ;(getRefreshToken as jest.Mock).mockResolvedValue('an-invalid-refresh-token')
    server.use(refreshSuccessHandler, getMeSuccessHandler)

    await renderBootstrap()

    await waitFor(() => expect(useAuthStore.getState().isSessionLoading).toBe(false))
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(getAccessToken()).toBeNull()
  })

  it('clears the session when the refresh succeeds but fetching the current user fails', async () => {
    ;(getRefreshToken as jest.Mock).mockResolvedValue(VALID_REFRESH_TOKEN)
    server.use(refreshSuccessHandler, getMeUnauthorizedHandler)

    await renderBootstrap()

    await waitFor(() => expect(useAuthStore.getState().isSessionLoading).toBe(false))
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(getAccessToken()).toBeNull()
  })
})
