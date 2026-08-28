import { apiClient } from '@/shared/lib/axios'
import type { ApiSuccessResponse, PaginationMeta } from '@/shared/types/api.types'
import type {
  Credential,
  CredentialListParams,
  CreateCredentialRequest,
  UpdateCredentialRequest,
} from '../types/credential.types'

export const credentialService = {
  getAll: async (params?: CredentialListParams) => {
    const res = await apiClient.get<ApiSuccessResponse<Credential[]>>('/credentials', { params })
    return { data: res.data.data, meta: res.data.meta as PaginationMeta }
  },
  getById: async (id: string) => {
    const res = await apiClient.get<ApiSuccessResponse<Credential>>(`/credentials/${id}`)
    return res.data.data
  },
  create: async (payload: CreateCredentialRequest) => {
    const res = await apiClient.post<ApiSuccessResponse<Credential>>('/credentials', payload)
    return res.data.data
  },
  update: async (id: string, payload: UpdateCredentialRequest) => {
    const res = await apiClient.patch<ApiSuccessResponse<Credential>>(`/credentials/${id}`, payload)
    return res.data.data
  },
  remove: (id: string) => apiClient.delete(`/credentials/${id}`),
}
