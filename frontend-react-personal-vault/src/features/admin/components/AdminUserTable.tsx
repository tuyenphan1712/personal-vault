import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/Button'
import { useAdminUsers } from '../hooks/useAdminUsers'
import type { AdminUser } from '../types/admin.types'
import { AdminUserRow } from './AdminUserRow'

const PAGE_LIMIT = 20

interface AdminUserTableProps {
  currentUserId?: string
  onNotify: (message: string) => void
  onRequestDelete: (user: AdminUser) => void
}

export function AdminUserTable({ currentUserId, onNotify, onRequestDelete }: AdminUserTableProps) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { data, isLoading, isError } = useAdminUsers({ page, limit: PAGE_LIMIT, search: search || undefined })

  return (
    <div className="flex flex-col gap-4">
      <input
        type="search"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value)
          setPage(1)
        }}
        placeholder={t('admin.searchPlaceholder')}
        className="w-full max-w-xs rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink shadow-sm focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-primary"
      />

      {isLoading ? (
        <p className="text-sm text-muted">{t('admin.loading')}</p>
      ) : isError ? (
        <div className="rounded-lg border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">{t('admin.loadError')}</div>
      ) : !data || data.data.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-line px-6 py-10 text-center">
          <p className="text-sm font-medium text-ink">{t('admin.emptyTitle')}</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-line bg-surface-hover text-left text-xs font-medium uppercase tracking-wide text-muted">
                  <th className="px-4 py-2.5 pr-4 font-medium">{t('admin.columnPhone')}</th>
                  <th className="px-4 py-2.5 pr-4 font-medium">{t('admin.columnFullName')}</th>
                  <th className="px-4 py-2.5 pr-4 font-medium">{t('admin.columnRole')}</th>
                  <th className="px-4 py-2.5 pr-4 font-medium">{t('admin.columnStatus')}</th>
                  <th className="px-4 py-2.5 pr-4 font-medium">{t('admin.columnCreatedAt')}</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="[&>tr>td]:px-4">
                {data.data.map((user) => (
                  <AdminUserRow
                    key={user.id}
                    user={user}
                    isSelf={user.id === currentUserId}
                    onNotify={onNotify}
                    onRequestDelete={onRequestDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {data.meta.totalPages > 1 ? (
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-muted">{t('admin.pageIndicator', { page: data.meta.page, totalPages: data.meta.totalPages })}</span>
              <div className="flex gap-1.5">
                <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
                  {t('admin.prevPage')}
                </Button>
                <Button variant="secondary" disabled={page >= data.meta.totalPages} onClick={() => setPage((current) => current + 1)}>
                  {t('admin.nextPage')}
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
