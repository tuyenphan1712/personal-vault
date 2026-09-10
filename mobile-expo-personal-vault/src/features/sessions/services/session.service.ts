import { apiClient } from '@/src/shared/lib/api/axios'
import { getRefreshToken } from '@/src/shared/lib/storage/secureStorage'
import type { ApiSuccessResponse } from '@/src/shared/types/api.types'
import type { Session } from '../types/session.types'

export const sessionService = {
  getAll: async () => {
    const currentRefreshToken = await getRefreshToken()
    const res = await apiClient.get<ApiSuccessResponse<Session[]>>('/sessions', { params: { currentRefreshToken } })
    return res.data.data
  },
  revoke: async (id: string) => {
    const currentRefreshToken = await getRefreshToken()
    return apiClient.delete(`/sessions/${id}`, { params: { currentRefreshToken } })
  },
}
