export interface DocumentTypeOption {
  value: string
  label: string
}

/**
 * Suggested `docType` values for the upload picker — one broad category per option. The backend
 * accepts any non-blank free-text value (see API_SPEC.md §7), so this list is a UI convenience,
 * not a whitelist: a value picked here is never validated against it server-side.
 */
export const DOCUMENT_TYPE_OPTIONS: DocumentTypeOption[] = [
  { value: 'identity_civil_status', label: 'Giấy tờ định danh & Hộ tịch' },
  { value: 'education_qualifications', label: 'Bằng cấp & Chứng chỉ' },
  { value: 'employment_contracts', label: 'Hồ sơ Lao động & Hợp đồng' },
  { value: 'medical_health', label: 'Y tế & Sức khỏe' },
  { value: 'finance_tax', label: 'Tài chính & Thuế' },
  { value: 'property_vehicles', label: 'Tài sản & Phương tiện' },
  { value: 'legal_misc', label: 'Giấy tờ Pháp lý & Ủy quyền khác' },
]

/** Sentinel select value that reveals a free-text input for a docType not covered above. */
export const OTHER_DOCUMENT_TYPE = '__other__'

const DOCUMENT_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  DOCUMENT_TYPE_OPTIONS.map((option) => [option.value, option.label]),
)

/** Maps a stored docType value back to its Vietnamese label, falling back to the raw value for a free-typed "Other" entry. */
export function getDocumentTypeLabel(docType: string | null): string | null {
  if (!docType) {
    return null
  }
  return DOCUMENT_TYPE_LABELS[docType] ?? docType
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
