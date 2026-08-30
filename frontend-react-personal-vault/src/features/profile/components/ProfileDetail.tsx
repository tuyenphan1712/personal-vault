import { Button } from '@/shared/components/Button'
import type { Profile } from '../types/profile.types'

interface ProfileDetailProps {
  profile: Profile
  onEdit: () => void
}

export function ProfileDetail({ profile, onEdit }: ProfileDetailProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Phone</p>
        <p className="mt-1 font-mono text-sm text-ink">{profile.phone}</p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Full name</p>
        <p className="mt-1 text-sm text-ink">{profile.fullName}</p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Birthday</p>
        <p className="mt-1 text-sm text-ink">
          {profile.birthday
            ? new Date(profile.birthday).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : '—'}
        </p>
      </div>
      <Button variant="secondary" onClick={onEdit} className="mt-1 self-start">
        Edit profile
      </Button>
    </div>
  )
}
