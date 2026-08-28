import { useState } from 'react'
import { Button } from '@/shared/components/Button'
import { decryptValue } from '@/shared/lib/crypto'
import { getEncryptionKey } from '@/shared/lib/keyStore'
import { useDeleteCredential } from '../hooks/useDeleteCredential'
import type { Credential } from '../types/credential.types'

interface CredentialCardProps {
  credential: Credential
  onEdit: (credential: Credential) => void
  onUnlockNeeded: () => void
}

export function CredentialCard({ credential, onEdit, onUnlockNeeded }: CredentialCardProps) {
  const [revealed, setRevealed] = useState<string | null>(null)
  const [revealError, setRevealError] = useState<string | null>(null)
  const [lastSeenCiphertext, setLastSeenCiphertext] = useState(credential.encryptedPassword)
  const deleteCredential = useDeleteCredential()

  // The encrypted value changes after an edit — any previously revealed plaintext is now stale
  // (and wouldn't even decrypt against the new ciphertext), so hide it again.
  if (lastSeenCiphertext !== credential.encryptedPassword) {
    setLastSeenCiphertext(credential.encryptedPassword)
    setRevealed(null)
    setRevealError(null)
  }

  const handleReveal = async () => {
    setRevealError(null)
    const key = getEncryptionKey()
    if (!key) {
      setRevealError('Vault is locked.')
      return
    }
    try {
      const password = await decryptValue(credential.encryptedPassword, key)
      setRevealed(password)
    } catch {
      setRevealError('Could not decrypt — try unlocking the vault again.')
    }
  }

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-ink">{credential.platformName}</p>
          <p className="text-sm text-muted">{credential.account}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => onEdit(credential)}>
            Edit
          </Button>
          <Button
            variant="danger"
            isLoading={deleteCredential.isPending}
            onClick={() => deleteCredential.mutate(credential.id)}
          >
            Delete
          </Button>
        </div>
      </div>
      {credential.note ? <p className="text-sm text-muted">{credential.note}</p> : null}
      <div className="flex items-center gap-2">
        {revealed ? (
          <code className="rounded bg-mist-soft px-2 py-1 text-sm text-mist">{revealed}</code>
        ) : (
          <Button variant="secondary" onClick={handleReveal}>
            Show password
          </Button>
        )}
        {revealError ? (
          <>
            <p className="text-sm text-danger">{revealError}</p>
            <Button variant="secondary" onClick={onUnlockNeeded}>
              Unlock again
            </Button>
          </>
        ) : null}
      </div>
    </li>
  )
}
