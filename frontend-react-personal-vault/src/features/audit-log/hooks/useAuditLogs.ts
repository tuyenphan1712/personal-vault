import { useQuery } from '@tanstack/react-query'
import { auditLogService } from '../services/audit-log.service'
import type { AuditLogListParams } from '../types/audit-log.types'
import { auditLogKeys } from './auditLogKeys'

export function useAuditLogs(params?: AuditLogListParams) {
  return useQuery({
    queryKey: auditLogKeys.list(params),
    queryFn: () => auditLogService.getAll(params),
  })
}
