import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/routes/routes'
import { BackLink } from '@/shared/components/BackLink'
import { TopBar } from '@/shared/components/TopBar'
import { ProfileDetail } from '../components/ProfileDetail'
import { ProfileForm } from '../components/ProfileForm'
import { useProfile } from '../hooks/useProfile'

export function ProfilePage() {
  const { t } = useTranslation()
  const { data: profile, isLoading, isError } = useProfile()
  const [isEditing, setIsEditing] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <TopBar />
      <div className="mx-auto w-full max-w-xl px-4 py-10">
        <BackLink to={ROUTES.DASHBOARD}>{t('common.backToDashboard')}</BackLink>
        <div className="mt-6 border-b border-line pb-6">
          <h1 className="font-serif text-3xl font-light tracking-tight text-ink">{t('profile.pageTitle')}</h1>
          <p className="mt-1 text-sm text-muted">{t('profile.pageSubtitle')}</p>
        </div>
        <div className="mt-8 rounded-2xl border border-line bg-surface p-8 shadow-sm">
          {isLoading ? (
            <p className="text-sm text-muted">{t('common.loading')}</p>
          ) : isError || !profile ? (
            <p className="text-sm text-danger">{t('profile.loadError')}</p>
          ) : (
            <>
              <div className="mb-6 flex items-center gap-3.5 border-b border-line pb-6">
                <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary-soft font-serif text-xl text-primary-dark">
                  {profile.fullName.charAt(0).toUpperCase()}
                </span>
                <p className="text-base font-medium text-ink">{profile.fullName}</p>
              </div>
              {isEditing ? (
                <ProfileForm profile={profile} onSuccess={() => setIsEditing(false)} onCancel={() => setIsEditing(false)} />
              ) : (
                <ProfileDetail profile={profile} onEdit={() => setIsEditing(true)} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
