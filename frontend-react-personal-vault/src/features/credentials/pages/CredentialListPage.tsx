import { useState } from 'react'
import { ROUTES } from '@/routes/routes'
import { BackLink } from '@/shared/components/BackLink'
import { Button } from '@/shared/components/Button'
import { Modal } from '@/shared/components/Modal'
import { Toast } from '@/shared/components/Toast'
import { getEncryptionKey, setEncryptionKey } from '@/shared/lib/keyStore'
import { CredentialForm } from '../components/CredentialForm'
import { CredentialList } from '../components/CredentialList'
import { UnlockVaultPrompt } from '../components/UnlockVaultPrompt'
import { useToast } from '../hooks/useToast'
import type { Credential } from '../types/credential.types'

export function CredentialListPage() {
  const [isUnlocked, setIsUnlocked] = useState(() => getEncryptionKey() !== null)
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const { message: toastMessage, notify } = useToast()

  const handleUnlockNeeded = () => {
    setEncryptionKey(null)
    setIsUnlocked(false)
  }

  if (!isUnlocked) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <BackLink to={ROUTES.DASHBOARD}>Back to dashboard</BackLink>
        <div className="mt-6">
          <UnlockVaultPrompt onUnlocked={() => setIsUnlocked(true)} />
        </div>
      </div>
    )
  }

  const isModalOpen = isCreating || editingCredential !== null
  const closeModal = () => {
    setIsCreating(false)
    setEditingCredential(null)
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10">
      <BackLink to={ROUTES.DASHBOARD}>Back to dashboard</BackLink>
      <div className="flex items-start justify-between gap-4 border-b border-line pb-6">
        <div>
          <h1 className="font-serif text-3xl font-light tracking-tight text-ink">Credentials</h1>
          <p className="mt-1 text-sm text-muted">Saved logins, encrypted on this device before they're stored.</p>
        </div>
        <Button className="flex-shrink-0" onClick={() => setIsCreating(true)}>
          Add credential
        </Button>
      </div>
      <CredentialList onEdit={setEditingCredential} onUnlockNeeded={handleUnlockNeeded} onNotify={notify} />
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingCredential ? 'Edit credential' : 'Add credential'}
        titleClassName="font-serif text-xl font-normal"
      >
        <CredentialForm
          credential={editingCredential ?? undefined}
          onSuccess={(message) => {
            closeModal()
            notify(message)
          }}
        />
      </Modal>
      <Toast message={toastMessage} />
    </div>
  )
}
