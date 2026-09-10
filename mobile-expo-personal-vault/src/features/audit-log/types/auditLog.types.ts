export type AuditAction =
  | 'PASSWORD_CHANGED'
  | 'PIN_CHANGED'
  | 'CREDENTIAL_CREATED'
  | 'CREDENTIAL_UPDATED'
  | 'CREDENTIAL_DELETED'
  | 'DOCUMENT_UPLOADED'
  | 'DOCUMENT_DELETED'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'ACCOUNT_LOCKED'

export interface AuditLogEntry {
  id: string
  action: AuditAction
  targetLabel: string | null
  createdAt: string
  readAt: string | null
}

export interface AuditLogListParams {
  page?: number
  limit?: number
}

export interface UnreadCount {
  count: number
}
