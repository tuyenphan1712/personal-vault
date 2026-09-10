import { useQuery } from '@tanstack/react-query'
import { auditLogService } from '../services/audit-log.service'
import { auditLogKeys } from './auditLogKeys'

export function useUnreadCount() {
  return useQuery({
    queryKey: auditLogKeys.unreadCount(),
    queryFn: () => auditLogService.getUnreadCount(),
  })
}
