import { useQuery } from '@tanstack/react-query'
import { auditLogService } from '../services/auditLog.service'
import { auditLogKeys } from './auditLogKeys'

export function useUnreadCount() {
  return useQuery({
    queryKey: auditLogKeys.unreadCount(),
    queryFn: () => auditLogService.getUnreadCount(),
  })
}
