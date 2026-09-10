import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/Button'
import { toIntlLocale } from '@/shared/i18n'
import type { Session } from '../types/session.types'

interface SessionRowProps {
  session: Session
  onRevoke: (session: Session) => void
}

export function SessionRow({ session, onRevoke }: SessionRowProps) {
  const { t, i18n } = useTranslation()

  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">
          {t(`sessions.clientType.${session.clientType}`)}
          {session.deviceInfo ? <span className="text-muted"> · {session.deviceInfo}</span> : null}
        </p>
        <p className="mt-0.5 text-xs text-muted">
          {session.isCurrent
            ? t('sessions.currentDevice')
            : t('sessions.lastActive', { date: new Date(session.createdAt).toLocaleString(toIntlLocale(i18n.language)) })}
        </p>
      </div>
      {session.isCurrent ? null : (
        <Button variant="secondary" className="flex-shrink-0" onClick={() => onRevoke(session)}>
          {t('sessions.revokeButton')}
        </Button>
      )}
    </li>
  )
}
