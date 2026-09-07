import { ALLOWED_DOCUMENT_TYPES, MAX_FILE_SIZE_BYTES } from '@/src/config/constants'
import type { PickedFile } from '../types/document.types'

export type FileValidationErrorCode = 'unsupportedType' | 'tooLarge'

export interface FileValidationResult {
  isValid: boolean
  errorCode: FileValidationErrorCode | null
}

// On-device check for immediate feedback only — the backend's 415/413 response
// is the source of truth (a picker's reported mimeType/size can be wrong or missing).
// Returns an error CODE, not a message: this is a plain (non-React) function that
// cannot call t() — the calling component translates via t(`upload.${code}`).
export function validatePickedFile(file: PickedFile): FileValidationResult {
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.mimeType as (typeof ALLOWED_DOCUMENT_TYPES)[number])) {
    return { isValid: false, errorCode: 'unsupportedType' }
  }

  if (typeof file.size === 'number' && file.size > MAX_FILE_SIZE_BYTES) {
    return { isValid: false, errorCode: 'tooLarge' }
  }

  return { isValid: true, errorCode: null }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Mirrors the docType picker categories in API_SPEC.md §3 — UI-only, not enforced by the backend.
// These are the literal string VALUES sent to the API and must never be translated.
// Display labels are looked up via i18n (`docType.categories.<value>`) at render time.
export const DOC_TYPE_CATEGORY_VALUES = [
  'identity_civil_status',
  'education_qualifications',
  'employment_contracts',
  'medical_health',
  'finance_tax',
  'property_vehicles',
  'legal_misc',
] as const
