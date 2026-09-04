export interface DocumentRecord {
  id: string
  title: string
  docType: string | null
  mimeType: string
  fileSize: number
  createdAt: string
  updatedAt: string
}

export interface DocumentListParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
  docType?: string
}

export interface PickedFile {
  uri: string
  name: string
  mimeType: string
  size?: number
}

export interface UploadDocumentPayload {
  file: PickedFile
  title: string
  docType?: string | null
}
