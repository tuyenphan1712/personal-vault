import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/routes/routes'
import { BackLink } from '@/shared/components/BackLink'
import { Button } from '@/shared/components/Button'
import { TopBar } from '@/shared/components/TopBar'
import { useAuditLogs } from '../hooks/useAuditLogs'
import { AuditLogList } from '../components/AuditLogList'

const PAGE_SIZE = 20

export function AuditLogPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const { data, isLoading, isError } = useAuditLogs({ page, limit: PAGE_SIZE })

  const totalPages = data?.meta.totalPages ?? 1

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <TopBar />
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
        <BackLink to={ROUTES.DASHBOARD}>{t('common.backToDashboard')}</BackLink>
        <div className="border-b border-line pb-6">
          <h1 className="font-serif text-3xl font-light tracking-tight text-ink">{t('auditLog.pageTitle')}</h1>
          <p className="mt-1 text-sm text-muted">{t('auditLog.pageSubtitle')}</p>
        </div>
        <div className="rounded-md border border-line bg-surface">
          <AuditLogList entries={data?.data ?? []} isLoading={isLoading} isError={isError} />
        </div>
        {totalPages > 1 ? (
          <div className="flex items-center justify-between">
            <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
              {t('auditLog.prevPage')}
            </Button>
            <span className="text-sm text-muted">{t('auditLog.pageIndicator', { page, totalPages })}</span>
            <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>
              {t('auditLog.nextPage')}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
