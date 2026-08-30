import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/Button'
import { toIntlLocale } from '@/shared/i18n'
import type { Profile } from '../types/profile.types'

interface ProfileDetailProps {
  profile: Profile
  onEdit: () => void
}

export function ProfileDetail({ profile, onEdit }: ProfileDetailProps) {
  const { t, i18n } = useTranslation()

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{t('profile.phone')}</p>
        <p className="mt-1 font-mono text-sm text-ink">{profile.phone}</p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{t('profile.fullName')}</p>
        <p className="mt-1 text-sm text-ink">{profile.fullName}</p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{t('profile.birthday')}</p>
        <p className="mt-1 text-sm text-ink">
          {profile.birthday
            ? new Date(profile.birthday).toLocaleDateString(toIntlLocale(i18n.language), {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : '—'}
        </p>
      </div>
      <Button variant="secondary" onClick={onEdit} className="mt-1 self-start">
        {t('profile.editButton')}
      </Button>
    </div>
  )
}
