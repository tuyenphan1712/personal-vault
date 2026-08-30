import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useLogout } from '@/features/auth'
import { ROUTES } from '@/routes/routes'
import { useThemeStore } from '@/shared/theme/theme.store'
import { Button } from './Button'
import { LanguageSwitcher } from './LanguageSwitcher'

export function TopBar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const logout = useLogout()
  const { mode, toggleTheme } = useThemeStore()

  return (
    <header className="flex h-[60px] flex-none items-center gap-4 border-b border-line bg-surface px-7">
      <Logo />
      <div className="flex-1" />
      <LanguageSwitcher />
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={mode === 'light' ? t('common.switchToDarkMode') : t('common.switchToLightMode')}
        title={mode === 'light' ? t('common.darkMode') : t('common.lightMode')}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-muted transition-colors hover:bg-surface-hover hover:text-ink"
      >
        {mode === 'light' ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
        )}
      </button>
      <Button
        variant="secondary"
        isLoading={logout.isPending}
        onClick={() => logout.mutate(undefined, { onSuccess: () => navigate(ROUTES.LOGIN) })}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        {t('common.logout')}
      </Button>
    </header>
  )
}

function Logo() {
  return (
    <svg viewBox="0 0 260 48" width="176" height="32" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="19" stroke="var(--color-ink)" strokeWidth="1.6" />
      <circle cx="24" cy="24" r="13.5" stroke="#b08442" strokeWidth="1.1" strokeDasharray="1.4 3.2" strokeLinecap="round" />
      <path d="M16.5 20.5 L24 28.5 L31.5 20.5" stroke="var(--color-ink)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 28.5 V34" stroke="#b08442" strokeWidth="2.4" strokeLinecap="round" />
      <text x="56" y="26" fontFamily="Newsreader, Georgia, serif" fontSize="23" fontWeight="400" fill="var(--color-ink)" letterSpacing="-0.2">
        Personal Vault
      </text>
      <text x="56.5" y="39" fontFamily="IBM Plex Sans, Helvetica, sans-serif" fontSize="8.5" fontWeight="500" letterSpacing="2.2" fill="var(--color-muted)">
        SEALED BEFORE IT LEAVES
      </text>
    </svg>
  )
}
