import { ALLOWED_DOCUMENT_TYPES, MAX_FILE_SIZE_BYTES } from '@/src/config/constants'
import type { PickedFile } from '../types/document.types'

export interface FileValidationResult {
  isValid: boolean
  errorMessage: string | null
}

// On-device check for immediate feedback only — the backend's 415/413 response
// is the source of truth (a picker's reported mimeType/size can be wrong or missing).
export function validatePickedFile(file: PickedFile): FileValidationResult {
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.mimeType as (typeof ALLOWED_DOCUMENT_TYPES)[number])) {
    return { isValid: false, errorMessage: 'Only JPEG, PNG, or PDF files are supported.' }
  }

  if (typeof file.size === 'number' && file.size > MAX_FILE_SIZE_BYTES) {
    return { isValid: false, errorMessage: 'File is larger than 10MB.' }
  }

  return { isValid: true, errorMessage: null }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Mirrors the docType picker categories in API_SPEC.md §3 — UI-only, not enforced by the backend.
export const DOC_TYPE_CATEGORIES = [
  { label: 'Identity & Civil Status', value: 'identity_civil_status' },
  { label: 'Education & Qualifications', value: 'education_qualifications' },
  { label: 'Employment & Contracts', value: 'employment_contracts' },
  { label: 'Medical & Health', value: 'medical_health' },
  { label: 'Finance & Tax', value: 'finance_tax' },
  { label: 'Property & Vehicles', value: 'property_vehicles' },
  { label: 'Legal & Miscellaneous', value: 'legal_misc' },
] as const

export function docTypeLabel(docType: string | null): string {
  if (!docType) return 'Uncategorized'
  return DOC_TYPE_CATEGORIES.find((category) => category.value === docType)?.label ?? docType
}
