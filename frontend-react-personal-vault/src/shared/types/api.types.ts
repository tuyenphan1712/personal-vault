export interface ApiSuccessResponse<T> {
  success: true
  data: T
  meta: PaginationMeta | null
}

export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details: unknown
  }
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}
