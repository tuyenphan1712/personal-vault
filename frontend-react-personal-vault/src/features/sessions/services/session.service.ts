import { apiClient } from '@/shared/lib/axios'
import type { ApiSuccessResponse } from '@/shared/types/api.types'
import type { Session } from '../types/session.types'

export const sessionService = {
  getAll: async () => {
    const res = await apiClient.get<ApiSuccessResponse<Session[]>>('/sessions')
    return res.data.data
  },
  revoke: (id: string) => apiClient.delete(`/sessions/${id}`),
}
