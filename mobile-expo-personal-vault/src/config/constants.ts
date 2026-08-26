export const API_BASE_URL: string =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api/v1'

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

export const ALLOWED_DOCUMENT_TYPES = ['image/jpeg', 'image/png', 'application/pdf'] as const

export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

export const CIPHERTEXT_VERSION = 1
