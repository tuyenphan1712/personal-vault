import { useCredentials } from '../hooks/useCredentials'
import type { Credential } from '../types/credential.types'
import { CredentialCard } from './CredentialCard'

interface CredentialListProps {
  onEdit: (credential: Credential) => void
  onUnlockNeeded: () => void
}

export function CredentialList({ onEdit, onUnlockNeeded }: CredentialListProps) {
  const { data, isLoading, isError } = useCredentials()

  if (isLoading) {
    return <p className="text-sm text-muted">Loading credentials…</p>
  }

  if (isError) {
    return <p className="text-sm text-danger">Couldn't load your credentials. Try again.</p>
  }

  if (!data || data.data.length === 0) {
    return <p className="text-sm text-muted">No credentials yet — add your first one.</p>
  }

  return (
    <ul className="flex flex-col gap-3">
      {data.data.map((credential) => (
        <CredentialCard
          key={credential.id}
          credential={credential}
          onEdit={onEdit}
          onUnlockNeeded={onUnlockNeeded}
        />
      ))}
    </ul>
  )
}
