import { useQuery } from '@tanstack/react-query'
import { documentService } from '../services/document.service'
import type { DocumentListParams } from '../types/document.types'
import { documentKeys } from './documentKeys'

export function useDocuments(params?: DocumentListParams) {
  return useQuery({
    queryKey: documentKeys.list(params),
    queryFn: () => documentService.getAll(params),
  })
}
