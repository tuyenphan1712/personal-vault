import { useTranslation } from 'react-i18next'
import { toIntlLocale } from '@/shared/i18n'
import type { AuditLogEntry } from '../types/audit-log.types'

interface AuditLogItemProps {
  entry: AuditLogEntry
}

export function AuditLogItem({ entry }: AuditLogItemProps) {
  const { t, i18n } = useTranslation()
  const isUnread = entry.readAt === null
  const actionLabel = t(`auditLog.actions.${entry.action}`)

  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <span
        aria-hidden="true"
        className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${isUnread ? 'bg-primary' : 'bg-transparent'}`}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-ink">
          {actionLabel}
          {entry.targetLabel ? <span className="font-medium"> · {entry.targetLabel}</span> : null}
        </p>
        <p className="mt-0.5 text-xs text-muted">
          {new Date(entry.createdAt).toLocaleString(toIntlLocale(i18n.language))}
        </p>
      </div>
    </li>
  )
}
