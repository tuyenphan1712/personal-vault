import { isAxiosError } from 'axios'
import type { ApiErrorResponse } from '@/src/shared/types/api.types'

export function extractAuthErrorMessage(error: unknown): string {
  if (isAxiosError<ApiErrorResponse>(error) && error.response?.data?.error) {
    const { code, message, details } = error.response.data.error
    if (code === 'AUTH_004' && typeof details === 'object' && details && 'retryAfterSeconds' in details) {
      const retryAfterSeconds = (details as { retryAfterSeconds: number }).retryAfterSeconds
      return `Too many failed attempts. Try again in ${retryAfterSeconds}s.`
    }
    return message
  }
  return 'Something went wrong. Please try again.'
}
