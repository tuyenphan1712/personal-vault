import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRevokeSession } from '../hooks/useRevokeSession'
import { useSessions } from '../hooks/useSessions'
import type { Session } from '../types/session.types'
import { RevokeSessionDialog } from './RevokeSessionDialog'
import { SessionRow } from './SessionRow'

export function SessionList() {
  const { t } = useTranslation()
  const { data: sessions, isLoading, isError } = useSessions()
  const revokeSession = useRevokeSession()
  const [pendingRevoke, setPendingRevoke] = useState<Session | null>(null)

  if (isLoading) {
    return <p className="text-sm text-muted">{t('sessions.loading')}</p>
  }

  if (isError || !sessions) {
    return <p className="text-sm text-danger">{t('sessions.loadError')}</p>
  }

  if (sessions.length === 0) {
    return <p className="text-sm text-muted">{t('sessions.empty')}</p>
  }

  return (
    <>
      <ul className="divide-y divide-line">
        {sessions.map((session) => (
          <SessionRow key={session.id} session={session} onRevoke={setPendingRevoke} />
        ))}
      </ul>
      <RevokeSessionDialog
        session={pendingRevoke}
        isRevoking={revokeSession.isPending}
        onCancel={() => setPendingRevoke(null)}
        onConfirm={() => {
          if (!pendingRevoke) return
          revokeSession.mutate(pendingRevoke.id, { onSuccess: () => setPendingRevoke(null) })
        }}
      />
    </>
  )
}
