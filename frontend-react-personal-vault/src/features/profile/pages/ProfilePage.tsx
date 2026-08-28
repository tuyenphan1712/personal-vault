import { useState } from 'react'
import { ROUTES } from '@/routes/routes'
import { BackLink } from '@/shared/components/BackLink'
import { ProfileDetail } from '../components/ProfileDetail'
import { ProfileForm } from '../components/ProfileForm'
import { useProfile } from '../hooks/useProfile'

export function ProfilePage() {
  const { data: profile, isLoading, isError } = useProfile()
  const [isEditing, setIsEditing] = useState(false)

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <BackLink to={ROUTES.DASHBOARD}>Back to dashboard</BackLink>
      <div className="mt-6 border-b border-line pb-6">
        <h1 className="font-serif text-3xl font-light tracking-tight text-ink">Profile</h1>
        <p className="mt-1 text-sm text-muted">Your account details.</p>
      </div>
      <div className="mt-8 rounded-2xl border border-line bg-surface p-8 shadow-sm">
        {isLoading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : isError || !profile ? (
          <p className="text-sm text-danger">Could not load profile.</p>
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
  )
}
