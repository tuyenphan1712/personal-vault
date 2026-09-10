import { apiClient } from '@/src/shared/lib/api/axios'
import type { ApiSuccessResponse, PaginationMeta } from '@/src/shared/types/api.types'
import type { AuditLogEntry, AuditLogListParams, UnreadCount } from '../types/auditLog.types'

export const auditLogService = {
  getAll: async (params?: AuditLogListParams) => {
    const res = await apiClient.get<ApiSuccessResponse<AuditLogEntry[]>>('/audit-logs', { params })
    return { data: res.data.data, meta: res.data.meta as PaginationMeta }
  },
  getUnreadCount: async () => {
    const res = await apiClient.get<ApiSuccessResponse<UnreadCount>>('/audit-logs/unread-count')
    return res.data.data
  },
  markAllRead: () => apiClient.patch('/audit-logs/read-all'),
}
