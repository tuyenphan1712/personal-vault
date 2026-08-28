import { useState } from 'react'
import { Link } from 'react-router'
import { ROUTES } from '@/routes/routes'
import { ProfileDetail } from '../components/ProfileDetail'
import { ProfileForm } from '../components/ProfileForm'
import { useProfile } from '../hooks/useProfile'

export function ProfilePage() {
  const { data: profile, isLoading, isError } = useProfile()
  const [isEditing, setIsEditing] = useState(false)

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link to={ROUTES.DASHBOARD} className="text-sm text-muted underline">
        ← Back to dashboard
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-ink">Profile</h1>
      <div className="mt-6">
        {isLoading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : isError || !profile ? (
          <p className="text-sm text-danger">Could not load profile.</p>
        ) : isEditing ? (
          <ProfileForm profile={profile} onSuccess={() => setIsEditing(false)} onCancel={() => setIsEditing(false)} />
        ) : (
          <ProfileDetail profile={profile} onEdit={() => setIsEditing(true)} />
        )}
      </div>
    </div>
  )
}
