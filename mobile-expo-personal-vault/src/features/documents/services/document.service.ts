import { Directory, File, Paths } from 'expo-file-system'
import { API_BASE_URL } from '@/src/config/constants'
import { apiClient } from '@/src/shared/lib/api/axios'
import { getAccessToken } from '@/src/shared/lib/auth/tokenStore'
import type { ApiSuccessResponse, PaginationMeta } from '@/src/shared/types/api.types'
import type { DocumentListParams, DocumentRecord, UploadDocumentPayload } from '../types/document.types'

export const documentService = {
  getAll: async (params?: DocumentListParams) => {
    const res = await apiClient.get<ApiSuccessResponse<DocumentRecord[]>>('/documents', { params })
    return { data: res.data.data, meta: res.data.meta as PaginationMeta }
  },
  getById: async (id: string) => {
    const res = await apiClient.get<ApiSuccessResponse<DocumentRecord>>(`/documents/${id}`)
    return res.data.data
  },
  upload: async (payload: UploadDocumentPayload) => {
    const formData = new FormData()
    // React Native's FormData accepts this file-descriptor shape in place of a Blob.
    formData.append('file', {
      uri: payload.file.uri,
      name: payload.file.name,
      type: payload.file.mimeType,
    } as unknown as Blob)
    formData.append('title', payload.title)
    if (payload.docType) {
      formData.append('docType', payload.docType)
    }

    const res = await apiClient.post<ApiSuccessResponse<DocumentRecord>>('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.data
  },
  remove: (id: string) => apiClient.delete(`/documents/${id}`),
  // Authenticated binary download can't go through the shared Axios instance's JSON
  // handling, so it hits the endpoint directly with the same bearer token.
  download: async (id: string, suggestedFileName: string) => {
    const token = getAccessToken()
    const destination = new Directory(Paths.cache, 'documents')
    if (!destination.exists) {
      destination.create({ intermediates: true })
    }

    const downloaded = await File.downloadFileAsync(`${API_BASE_URL}/documents/${id}/download`, destination, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })

    const renamed = new File(destination, suggestedFileName)
    if (renamed.uri === downloaded.uri) {
      return downloaded
    }
    if (renamed.exists) {
      renamed.delete()
    }
    downloaded.move(renamed)
    return renamed
  },
}
