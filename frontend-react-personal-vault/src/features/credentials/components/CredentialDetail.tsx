import { useState } from 'react'
import { Button } from '@/shared/components/Button'
import { decryptValue } from '@/shared/lib/crypto'
import { getEncryptionKey } from '@/shared/lib/keyStore'
import type { Credential } from '../types/credential.types'

interface CredentialDetailProps {
  credential: Credential
  onUnlockNeeded: () => void
}

export function CredentialDetail({ credential, onUnlockNeeded }: CredentialDetailProps) {
  const [revealed, setRevealed] = useState<string | null>(null)
  const [revealError, setRevealError] = useState<string | null>(null)
  const [lastSeenCiphertext, setLastSeenCiphertext] = useState(credential.encryptedPassword)

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
      setRevealed(await decryptValue(credential.encryptedPassword, key))
    } catch {
      setRevealError('Could not decrypt — try unlocking the vault again.')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">{credential.platformName}</h1>
        <p className="text-sm text-muted">{credential.account}</p>
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
      <p className="text-xs text-muted">
        Last updated {new Date(credential.updatedAt).toLocaleString()}
      </p>
    </div>
  )
}
