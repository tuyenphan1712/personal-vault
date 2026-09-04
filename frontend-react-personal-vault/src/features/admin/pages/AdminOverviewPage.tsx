import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/routes/routes'
import { toIntlLocale } from '@/shared/i18n'
import { useAdminOverviewStats } from '../hooks/useAdminOverviewStats'

export function AdminOverviewPage() {
  const { t, i18n } = useTranslation()
  const { data: stats, isLoading, isError } = useAdminOverviewStats()

  return (
    <>
      <div className="border-b border-line pb-6">
        <h1 className="font-serif text-3xl font-light tracking-tight text-ink">{t('admin.overviewTitle')}</h1>
        <p className="mt-1 text-sm text-muted">{t('admin.overviewSubtitle')}</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted">{t('admin.overviewLoading')}</p>
      ) : isError || !stats ? (
        <div className="rounded-lg border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">{t('admin.overviewLoadError')}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label={t('admin.statTotal')} value={stats.total} dotClassName="bg-primary" />
            <StatCard label={t('admin.statActive')} value={stats.active} dotClassName="bg-primary" />
            <StatCard label={t('admin.statLocked')} value={stats.locked} dotClassName="bg-danger" />
            <StatCard label={t('admin.statAdmins')} value={stats.admins} dotClassName="bg-[#b08442]" />
          </div>

          <div className="rounded-lg border border-line bg-surface">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <h2 className="font-serif text-base font-medium text-ink">{t('admin.recentSignupsTitle')}</h2>
              <Link to={ROUTES.ADMIN_USERS} className="text-xs font-medium text-primary-dark hover:underline">
                {t('admin.viewAllUsers')} →
              </Link>
            </div>
            {stats.recentSignups.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-muted">{t('admin.noUsersYet')}</p>
            ) : (
              <ul>
                {stats.recentSignups.map((user) => (
                  <li key={user.id} className="flex items-center gap-3 border-b border-line px-5 py-2.5 text-sm last:border-0">
                    <span className="min-w-0 flex-1 truncate text-ink">{user.fullName}</span>
                    <span className="font-mono text-xs text-muted">{user.phone}</span>
                    <span className="flex-shrink-0 font-mono text-xs text-muted">
                      {new Date(user.createdAt).toLocaleDateString(toIntlLocale(i18n.language))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </>
  )
}

interface StatCardProps {
  label: string
  value: number
  dotClassName: string
}

function StatCard({ label, value, dotClassName }: StatCardProps) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-line bg-surface px-4 py-3.5">
      <span className="font-mono text-[10.5px] uppercase tracking-wide text-muted">{label}</span>
      <span className="flex items-baseline gap-2 font-mono text-2xl font-medium tabular-nums text-ink">
        <span className={`h-2 w-2 flex-shrink-0 rounded-full ${dotClassName}`} />
        {value}
      </span>
    </div>
  )
}
