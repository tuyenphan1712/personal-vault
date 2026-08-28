import type { DocumentListParams } from '../types/document.types'

export const documentKeys = {
  all: ['documents'] as const,
  list: (params?: DocumentListParams) => [...documentKeys.all, 'list', params] as const,
  detail: (id: string) => [...documentKeys.all, 'detail', id] as const,
}
