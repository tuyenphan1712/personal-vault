import { apiClient } from '@/shared/lib/axios'
import type { ApiSuccessResponse } from '@/shared/types/api.types'
import type { AuthUser, LoginRequest, LoginResponseData, RefreshResponseData, RegisterRequest } from '../types/auth.types'

export const authService = {
  register: async (payload: RegisterRequest) => {
    const res = await apiClient.post<ApiSuccessResponse<AuthUser>>('/auth/register', payload)
    return res.data.data
  },
  login: async (payload: LoginRequest) => {
    const res = await apiClient.post<ApiSuccessResponse<LoginResponseData>>('/auth/login', payload)
    return res.data.data
  },
  refresh: async () => {
    const res = await apiClient.post<ApiSuccessResponse<RefreshResponseData>>('/auth/refresh')
    return res.data.data
  },
  logout: () => apiClient.post('/auth/logout'),
  me: async () => {
    const res = await apiClient.get<ApiSuccessResponse<AuthUser>>('/auth/me')
    return res.data.data
  },
}
