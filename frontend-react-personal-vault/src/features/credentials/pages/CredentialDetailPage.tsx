import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { ROUTES } from '@/routes/routes'
import { getEncryptionKey, setEncryptionKey } from '@/shared/lib/keyStore'
import { CredentialDetail } from '../components/CredentialDetail'
import { UnlockVaultPrompt } from '../components/UnlockVaultPrompt'
import { useCredential } from '../hooks/useCredential'

export function CredentialDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [isUnlocked, setIsUnlocked] = useState(() => getEncryptionKey() !== null)
  const { data: credential, isLoading, isError } = useCredential(id ?? '')

  const handleUnlockNeeded = () => {
    setEncryptionKey(null)
    setIsUnlocked(false)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link to={ROUTES.CREDENTIALS} className="text-sm text-muted underline">
        ← Back to credentials
      </Link>
      <div className="mt-6">
        {!isUnlocked ? (
          <UnlockVaultPrompt onUnlocked={() => setIsUnlocked(true)} />
        ) : isLoading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : isError || !credential ? (
          <p className="text-sm text-danger">Credential not found.</p>
        ) : (
          <CredentialDetail credential={credential} onUnlockNeeded={handleUnlockNeeded} />
        )}
      </div>
    </div>
  )
}
