import type { TFunction } from 'i18next'

/**
 * Suggested `docType` values for the upload picker — one broad category per option. The backend
 * accepts any non-blank free-text value (see API_SPEC.md §7), so this list is a UI convenience,
 * not a whitelist: a value picked here is never validated against it server-side. Labels live in
 * the `documents.types.*` translation keys, not here.
 */
export const DOCUMENT_TYPE_VALUES = [
  'identity_civil_status',
  'education_qualifications',
  'employment_contracts',
  'medical_health',
  'finance_tax',
  'property_vehicles',
  'legal_misc',
] as const

export type DocumentTypeValue = (typeof DOCUMENT_TYPE_VALUES)[number]

/** Sentinel select value that reveals a free-text input for a docType not covered above. */
export const OTHER_DOCUMENT_TYPE = '__other__'

/** Maps a stored docType value back to its translated label, falling back to the raw value for a free-typed "Other" entry. */
export function getDocumentTypeLabel(docType: string | null, t: TFunction): string | null {
  if (!docType) {
    return null
  }
  return (DOCUMENT_TYPE_VALUES as readonly string[]).includes(docType) ? t(`documents.types.${docType}`) : docType
}

export interface Document {
  id: string
  title: string
  docType: string | null
  mimeType: string
  fileSize: number
  createdAt: string
  updatedAt: string
}

export interface UploadDocumentRequest {
  file: File
  title: string
  docType?: string
}

export interface DocumentListParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
  docType?: string
}
