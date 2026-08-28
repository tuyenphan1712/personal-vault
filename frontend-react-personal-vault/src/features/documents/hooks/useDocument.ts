import { useQuery } from '@tanstack/react-query'
import { documentService } from '../services/document.service'
import { documentKeys } from './documentKeys'

export function useDocument(id: string) {
  return useQuery({
    queryKey: documentKeys.detail(id),
    queryFn: () => documentService.getById(id),
  })
}
