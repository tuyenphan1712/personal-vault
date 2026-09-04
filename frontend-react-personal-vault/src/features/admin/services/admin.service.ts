import { apiClient } from '@/shared/lib/axios'
import type { ApiSuccessResponse, PaginationMeta } from '@/shared/types/api.types'
import type { AdminUser, AdminUserListParams, UpdateUserStatusRequest } from '../types/admin.types'

const OVERVIEW_PAGE_SIZE = 100

export const adminService = {
  getAll: async (params?: AdminUserListParams) => {
    const res = await apiClient.get<ApiSuccessResponse<AdminUser[]>>('/admin/users', { params })
    return { data: res.data.data, meta: res.data.meta as PaginationMeta }
  },
  /** Walks every page (at the API's max page size) to get the full user list for Overview stats — there's no dedicated aggregate/count endpoint. */
  getAllForOverview: async () => {
    const allUsers: AdminUser[] = []
    let page = 1

    while (true) {
      const { data, meta } = await adminService.getAll({ page, limit: OVERVIEW_PAGE_SIZE })
      allUsers.push(...data)
      if (page >= meta.totalPages || data.length === 0) {
        break
      }
      page += 1
    }

    return allUsers
  },
  updateStatus: async (id: string, payload: UpdateUserStatusRequest) => {
    const res = await apiClient.patch<ApiSuccessResponse<AdminUser>>(`/admin/users/${id}/status`, payload)
    return res.data.data
  },
  remove: (id: string) => apiClient.delete(`/admin/users/${id}`),
}
