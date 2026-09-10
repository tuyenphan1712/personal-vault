import type { AuditLogListParams } from '../types/auditLog.types'

export const auditLogKeys = {
  all: ['audit-logs'] as const,
  list: (params?: AuditLogListParams) => [...auditLogKeys.all, 'list', params] as const,
  unreadCount: () => [...auditLogKeys.all, 'unread-count'] as const,
}
