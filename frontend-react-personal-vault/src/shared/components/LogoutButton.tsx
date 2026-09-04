import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useLogout } from '@/features/auth'
import { ROUTES } from '@/routes/routes'
import { Button } from './Button'

export function LogoutButton() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const logout = useLogout()

  return (
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
  )
}
