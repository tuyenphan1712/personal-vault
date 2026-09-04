import { NavLink, Outlet } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/features/auth'
import { ROUTES } from '@/routes/routes'
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher'
import { Logo } from '@/shared/components/Logo'
import { LogoutButton } from '@/shared/components/LogoutButton'
import { ThemeToggleButton } from '@/shared/components/ThemeToggleButton'

export function AdminLayout() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)

  const tabClassName = ({ isActive }: { isActive: boolean }) =>
    `rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
      isActive ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'
    }`

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="flex flex-none flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-surface px-4 py-2.5 sm:px-7">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="inline-flex items-center rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary-dark">
            {t('admin.roleAdmin')}
          </span>
        </div>
        <nav className="flex gap-1 rounded-lg bg-surface-hover p-1">
          <NavLink to={ROUTES.ADMIN_OVERVIEW} end className={tabClassName}>
            {t('admin.tabOverview')}
          </NavLink>
          <NavLink to={ROUTES.ADMIN_USERS} className={tabClassName}>
            {t('admin.tabUsers')}
          </NavLink>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {user ? <span className="hidden font-mono text-xs text-muted md:inline">{user.fullName}</span> : null}
          <LanguageSwitcher />
          <ThemeToggleButton />
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-10">
        <Outlet />
      </main>
    </div>
  )
}
