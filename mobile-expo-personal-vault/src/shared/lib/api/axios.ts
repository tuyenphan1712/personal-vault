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

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined

    if (error.response?.status === 401 && originalRequest && !originalRequest._retried && refreshAccessToken) {
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
