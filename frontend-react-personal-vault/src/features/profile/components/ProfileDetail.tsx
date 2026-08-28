import { Button } from '@/shared/components/Button'
import type { Profile } from '../types/profile.types'

interface ProfileDetailProps {
  profile: Profile
  onEdit: () => void
}

export function ProfileDetail({ profile, onEdit }: ProfileDetailProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm text-muted">Phone</p>
        <p className="text-sm text-ink">{profile.phone}</p>
      </div>
      <div>
        <p className="text-sm text-muted">Full name</p>
        <p className="text-sm text-ink">{profile.fullName}</p>
      </div>
      <div>
        <p className="text-sm text-muted">Birthday</p>
        <p className="text-sm text-ink">{profile.birthday ?? '—'}</p>
      </div>
      <Button onClick={onEdit} className="self-start">
        Edit profile
      </Button>
    </div>
  )
}
