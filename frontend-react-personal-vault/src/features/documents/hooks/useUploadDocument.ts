import { useMutation, useQueryClient } from '@tanstack/react-query'
import { auditLogKeys } from '@/features/audit-log'
import { documentService } from '../services/document.service'
import { documentKeys } from './documentKeys'

export function useUploadDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: documentService.upload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all })
      queryClient.invalidateQueries({ queryKey: auditLogKeys.all })
    },
  })
}
