import { apiClient } from '@/src/shared/lib/api/axios'
import type { ApiSuccessResponse } from '@/src/shared/types/api.types'
import type { CurrentUser } from '../types/Session.types'
import type { LoginRequest, LoginResponse, RefreshResponse, RegisterRequest } from '../types/auth.types'

export const authService = {
  register: async (payload: RegisterRequest): Promise<CurrentUser> => {
    const res = await apiClient.post<ApiSuccessResponse<CurrentUser>>('/auth/register', payload)
    return res.data.data
  },

  login: async (phone: string, password: string): Promise<LoginResponse> => {
    const payload: LoginRequest = { phone, password, clientType: 'mobile' }
    const res = await apiClient.post<ApiSuccessResponse<LoginResponse>>('/auth/login', payload)
    return res.data.data
  },

  refresh: async (refreshToken: string): Promise<RefreshResponse> => {
    const res = await apiClient.post<ApiSuccessResponse<RefreshResponse>>('/auth/refresh', { refreshToken })
    return res.data.data
  },

  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/auth/logout', { refreshToken })
  },

  getMe: async (): Promise<CurrentUser> => {
    const res = await apiClient.get<ApiSuccessResponse<CurrentUser>>('/auth/me')
    return res.data.data
  },
}
