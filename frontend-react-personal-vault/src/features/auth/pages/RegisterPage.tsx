import { Link, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/routes/routes'
import { VaultBadge } from '@/shared/components/VaultBadge'
import { RegisterForm } from '../components/RegisterForm'

export function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-3 px-4 py-10">
      <VaultBadge />
      <div className="flex w-full flex-col items-center gap-4 rounded-xl border border-line bg-surface p-8 text-center shadow-sm">
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[#B08442]/35 bg-[#EFE3CE]">
          <span className="block h-3.5 w-3.5 rounded-full bg-[#B08442]" />
        </span>
        <div>
          <h1 className="font-serif text-3xl font-light tracking-tight text-ink">{t('auth.registerTitle')}</h1>
          <p className="mt-1 text-sm text-muted">{t('auth.registerSubtitle')}</p>
        </div>
        <RegisterForm onSuccess={() => navigate(ROUTES.LOGIN)} />
        <div className="w-full border-t border-line pt-4 font-mono text-xs uppercase tracking-wide text-muted">
          {t('auth.encryptionFooter')}
        </div>
      </div>
      <p className="text-center text-xs text-muted">
        {t('auth.hasAccount')}{' '}
        <Link to={ROUTES.LOGIN} className="font-medium text-ink underline">
          {t('auth.loginLink')}
        </Link>
      </p>
    </div>
  )
}
