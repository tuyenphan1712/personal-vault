import { useMutation, useQueryClient } from '@tanstack/react-query'
import { documentService } from '../services/document.service'
import { documentKeys } from './documentKeys'

export function useUploadDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: documentService.upload,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentKeys.all }),
  })
}
