import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { API_BASE_URL } from '../../config/constants'
import { getAccessToken } from './tokenStore'

// Registered by the auth feature at app startup to avoid a shared -> feature import.
let onUnauthorized: (() => Promise<string | null>) | null = null
let onSessionExpired: (() => void) | null = null

export function registerAuthHandlers(handlers: {
  refreshAccessToken: () => Promise<string | null>
  handleSessionExpired: () => void
}): void {
  onUnauthorized = handlers.refreshAccessToken
  onSessionExpired = handlers.handleSessionExpired
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken()
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined

    if (error.response?.status === 401 && originalRequest && !originalRequest._retried && onUnauthorized) {
      originalRequest._retried = true
      const newToken = await onUnauthorized()

      if (newToken) {
        originalRequest.headers.set('Authorization', `Bearer ${newToken}`)
        return apiClient(originalRequest)
      }

      onSessionExpired?.()
    }

    return Promise.reject(error)
  },
)
