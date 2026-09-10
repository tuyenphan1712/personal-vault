import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { ROUTES } from '@/routes/routes'
import { useAuditLogs } from '../hooks/useAuditLogs'
import { useMarkAllRead } from '../hooks/useMarkAllRead'
import { useUnreadCount } from '../hooks/useUnreadCount'
import { AuditLogList } from './AuditLogList'

const PREVIEW_LIMIT = 5

export function NotificationBell() {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const { data: unreadCount } = useUnreadCount()
  const { data: listResult, isLoading, isError } = useAuditLogs({ page: 1, limit: PREVIEW_LIMIT })
  const markAllRead = useMarkAllRead()

  const count = unreadCount?.count ?? 0
  const badgeLabel = count > 9 ? '9+' : String(count)

  useEffect(() => {
    if (!isOpen) return
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  function handleToggle() {
    const nextIsOpen = !isOpen
    setIsOpen(nextIsOpen)
    if (nextIsOpen && count > 0) {
      markAllRead.mutate()
    }
  }

  return (
    <div ref={containerRef} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={handleToggle}
        aria-label={t('auditLog.bellLabel')}
        aria-expanded={isOpen}
        className="relative flex h-9 w-9 items-center justify-center rounded-md border border-line bg-surface text-ink hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {count > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-medium text-surface">
            {badgeLabel}
          </span>
        ) : null}
      </button>
      {isOpen ? (
        <div className="absolute right-0 top-11 z-10 w-80 rounded-md border border-line bg-surface shadow-lg">
          <div className="border-b border-line px-4 py-3">
            <p className="text-sm font-medium text-ink">{t('auditLog.pageTitle')}</p>
          </div>
          <AuditLogList entries={listResult?.data ?? []} isLoading={isLoading} isError={isError} />
          <Link
            to={ROUTES.AUDIT_LOG}
            onClick={() => setIsOpen(false)}
            className="block border-t border-line px-4 py-3 text-center text-sm text-primary hover:underline"
          >
            {t('auditLog.viewAll')}
          </Link>
        </div>
      ) : null}
    </div>
  )
}
