import { apiClient } from '@/shared/lib/axios'
import type { ApiSuccessResponse, PaginationMeta } from '@/shared/types/api.types'
import type { Document, DocumentListParams, UploadDocumentRequest } from '../types/document.types'

export const documentService = {
  getAll: async (params?: DocumentListParams) => {
    const res = await apiClient.get<ApiSuccessResponse<Document[]>>('/documents', { params })
    return { data: res.data.data, meta: res.data.meta as PaginationMeta }
  },
  getById: async (id: string) => {
    const res = await apiClient.get<ApiSuccessResponse<Document>>(`/documents/${id}`)
    return res.data.data
  },
  upload: async (payload: UploadDocumentRequest) => {
    const formData = new FormData()
    formData.append('file', payload.file)
    formData.append('title', payload.title)
    if (payload.docType) {
      formData.append('docType', payload.docType)
    }

    const res = await apiClient.post<ApiSuccessResponse<Document>>('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.data
  },
  download: async (id: string) => {
    const res = await apiClient.get(`/documents/${id}/download`, { responseType: 'blob' })
    return res.data as Blob
  },
  remove: (id: string) => apiClient.delete(`/documents/${id}`),
}
