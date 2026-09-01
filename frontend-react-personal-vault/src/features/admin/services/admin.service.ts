import { apiClient } from '@/shared/lib/axios'
import type { ApiSuccessResponse, PaginationMeta } from '@/shared/types/api.types'
import type { AdminUser, AdminUserListParams, UpdateUserStatusRequest } from '../types/admin.types'

export const adminService = {
  getAll: async (params?: AdminUserListParams) => {
    const res = await apiClient.get<ApiSuccessResponse<AdminUser[]>>('/admin/users', { params })
    return { data: res.data.data, meta: res.data.meta as PaginationMeta }
  },
  updateStatus: async (id: string, payload: UpdateUserStatusRequest) => {
    const res = await apiClient.patch<ApiSuccessResponse<AdminUser>>(`/admin/users/${id}/status`, payload)
    return res.data.data
  },
  remove: (id: string) => apiClient.delete(`/admin/users/${id}`),
}
