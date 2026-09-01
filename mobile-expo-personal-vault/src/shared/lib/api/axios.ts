import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { API_BASE_URL } from '../../../config/constants'
import { getAccessToken } from '../auth/tokenStore'

// Registered by the auth feature at app startup to avoid a shared -> feature import.
let refreshAccessToken: (() => Promise<string | null>) | null = null
let handleSessionExpired: (() => void) | null = null

export function registerAuthHandlers(handlers: {
  refreshAccessToken: () => Promise<string | null>
  handleSessionExpired: () => void
}): void {
  refreshAccessToken = handlers.refreshAccessToken
  handleSessionExpired = handlers.handleSessionExpired
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
})

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken()
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

// Coordinates concurrent 401s onto a single in-flight refresh call.
let refreshPromise: Promise<string | null> | null = null

// A 401 from one of these endpoints is a login/refresh failure, not an expired session —
// retrying it through the refresh flow would recurse into itself (e.g. an invalid refresh
// token causes /auth/refresh to 401, which would otherwise try to refresh again).
const AUTH_ENDPOINTS_EXEMPT_FROM_REFRESH = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout']

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined
    const isExemptFromRefresh = AUTH_ENDPOINTS_EXEMPT_FROM_REFRESH.some((path) => originalRequest?.url?.includes(path))

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retried &&
      !isExemptFromRefresh &&
      refreshAccessToken
    ) {
      originalRequest._retried = true

      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null
        })
      }
      const newToken = await refreshPromise

      if (newToken) {
        originalRequest.headers.set('Authorization', `Bearer ${newToken}`)
        return apiClient(originalRequest)
      }

      handleSessionExpired?.()
    }

    return Promise.reject(error)
  },
)
