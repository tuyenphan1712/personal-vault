import { useTranslation } from 'react-i18next'
import type { AuditLogEntry } from '../types/audit-log.types'
import { AuditLogItem } from './AuditLogItem'

interface AuditLogListProps {
  entries: AuditLogEntry[]
  isLoading: boolean
  isError: boolean
}

export function AuditLogList({ entries, isLoading, isError }: AuditLogListProps) {
  const { t } = useTranslation()

  if (isLoading) {
    return <p className="px-4 py-6 text-sm text-muted">{t('auditLog.loading')}</p>
  }

  if (isError) {
    return <p className="px-4 py-6 text-sm text-danger">{t('auditLog.loadError')}</p>
  }

  if (entries.length === 0) {
    return <p className="px-4 py-6 text-sm text-muted">{t('auditLog.emptyTitle')}</p>
  }

  return (
    <ul className="divide-y divide-line">
      {entries.map((entry) => (
        <AuditLogItem key={entry.id} entry={entry} />
      ))}
    </ul>
  )
}
