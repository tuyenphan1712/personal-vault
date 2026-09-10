import { useMutation, useQueryClient } from '@tanstack/react-query'
import { auditLogService } from '../services/audit-log.service'
import { auditLogKeys } from './auditLogKeys'

export function useMarkAllRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: auditLogService.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: auditLogKeys.all })
    },
  })
}
