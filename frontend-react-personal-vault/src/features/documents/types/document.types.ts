export const DOCUMENT_TYPES = ['cccd', 'diploma', 'passport'] as const

export type DocumentType = (typeof DOCUMENT_TYPES)[number]

export interface Document {
  id: string
  title: string
  docType: DocumentType | null
  mimeType: string
  fileSize: number
  createdAt: string
  updatedAt: string
}

export interface UploadDocumentRequest {
  file: File
  title: string
  docType?: DocumentType
}

export interface DocumentListParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
  docType?: DocumentType
}
