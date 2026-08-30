import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/features/auth'
import { TopBar } from '@/shared/components/TopBar'
import { ROUTES } from '@/routes/routes'

interface NavTile {
  label: string
  description: string
  route: string
  icon: ReactNode
}

export function DashboardPage() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()

  const navTiles: NavTile[] = [
    {
      label: t('dashboard.navCredentialsLabel'),
      description: t('dashboard.navCredentialsDescription'),
      route: ROUTES.CREDENTIALS,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z" />
          <circle cx="16.5" cy="7.5" r="0.6" fill="currentColor" />
        </svg>
      ),
    },
    {
      label: t('dashboard.navDocumentsLabel'),
      description: t('dashboard.navDocumentsDescription'),
      route: ROUTES.DOCUMENTS,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
          <path d="M14 2v4a2 2 0 0 0 2 2h4" />
          <path d="M10 9H8" />
          <path d="M16 13H8" />
          <path d="M16 17H8" />
        </svg>
      ),
    },
    {
      label: t('dashboard.navProfileLabel'),
      description: t('dashboard.navProfileDescription'),
      route: ROUTES.PROFILE,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="5" />
          <path d="M20 21a8 8 0 0 0-16 0" />
        </svg>
      ),
    },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <TopBar />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <h1 className="font-serif text-4xl font-light tracking-tight text-ink">{t('dashboard.title')}</h1>
        <p className="mt-2.5 mb-10 text-sm text-muted">{t('dashboard.greeting', { name: user?.fullName })}</p>

        <div className="flex flex-wrap justify-center gap-6">
          {navTiles.map((tile) => (
            <button
              key={tile.route}
              type="button"
              onClick={() => navigate(tile.route)}
              className="flex w-60 flex-col items-start gap-3.5 rounded-2xl border border-line bg-surface p-7 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary-soft hover:shadow-md"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-primary-soft text-primary-dark">
                {tile.icon}
              </span>
              <span className="text-[17px] font-medium text-ink">{tile.label}</span>
              <span className="text-[13.5px] leading-relaxed text-muted">{tile.description}</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
