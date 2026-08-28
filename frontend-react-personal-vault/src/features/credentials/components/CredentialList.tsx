import { useCredentials } from '../hooks/useCredentials'
import type { Credential } from '../types/credential.types'
import { CredentialCard } from './CredentialCard'

interface CredentialListProps {
  onEdit: (credential: Credential) => void
  onUnlockNeeded: () => void
  onNotify: (message: string) => void
}

export function CredentialList({ onEdit, onUnlockNeeded, onNotify }: CredentialListProps) {
  const { data, isLoading, isError } = useCredentials()

  if (isLoading) {
    return <p className="text-sm text-muted">Loading credentials…</p>
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
        Couldn't load your credentials. Try again.
      </div>
    )
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-line px-6 py-10 text-center">
        <p className="text-sm font-medium text-ink">No credentials yet</p>
        <p className="text-sm text-muted">Add your first one to start building your vault.</p>
      </div>
    )
  }

  const count = data.data.length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <span className="font-mono text-xs uppercase tracking-wide text-muted">
          {count} {count === 1 ? 'credential' : 'credentials'}
        </span>
        <span className="h-px flex-1 bg-line" />
        <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary-dark">
          <CheckIcon />
          Encrypted
        </span>
      </div>
      <ul className="flex flex-col gap-3">
        {data.data.map((credential) => (
          <CredentialCard
            key={credential.id}
            credential={credential}
            onEdit={onEdit}
            onUnlockNeeded={onUnlockNeeded}
            onNotify={onNotify}
          />
        ))}
      </ul>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}
