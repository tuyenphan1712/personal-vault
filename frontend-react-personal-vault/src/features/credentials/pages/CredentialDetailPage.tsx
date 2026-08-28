import { useState } from 'react'
import { useParams } from 'react-router'
import { ROUTES } from '@/routes/routes'
import { BackLink } from '@/shared/components/BackLink'
import { Toast } from '@/shared/components/Toast'
import { getEncryptionKey, setEncryptionKey } from '@/shared/lib/keyStore'
import { CredentialDetail } from '../components/CredentialDetail'
import { UnlockVaultPrompt } from '../components/UnlockVaultPrompt'
import { useCredential } from '../hooks/useCredential'
import { useToast } from '../hooks/useToast'

export function CredentialDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [isUnlocked, setIsUnlocked] = useState(() => getEncryptionKey() !== null)
  const { data: credential, isLoading, isError } = useCredential(id ?? '')
  const { message: toastMessage, notify } = useToast()

  const handleUnlockNeeded = () => {
    setEncryptionKey(null)
    setIsUnlocked(false)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <BackLink to={ROUTES.CREDENTIALS}>Back to credentials</BackLink>
      <div className="mt-6">
        {!isUnlocked ? (
          <UnlockVaultPrompt onUnlocked={() => setIsUnlocked(true)} />
        ) : isLoading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : isError || !credential ? (
          <p className="text-sm text-danger">Credential not found.</p>
        ) : (
          <CredentialDetail credential={credential} onUnlockNeeded={handleUnlockNeeded} onNotify={notify} />
        )}
      </div>
      <Toast message={toastMessage} />
    </div>
  )
}
