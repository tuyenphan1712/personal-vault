import { useState } from 'react'
import { Button } from '@/shared/components/Button'
import { Modal } from '@/shared/components/Modal'
import { getEncryptionKey } from '@/shared/lib/keyStore'
import { CredentialForm } from '../components/CredentialForm'
import { CredentialList } from '../components/CredentialList'
import { UnlockVaultPrompt } from '../components/UnlockVaultPrompt'
import type { Credential } from '../types/credential.types'

export function CredentialListPage() {
  const [isUnlocked, setIsUnlocked] = useState(() => getEncryptionKey() !== null)
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  if (!isUnlocked) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <UnlockVaultPrompt onUnlocked={() => setIsUnlocked(true)} />
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Credentials</h1>
        <Button onClick={() => setIsCreating(true)}>Add credential</Button>
      </div>
      <CredentialList onEdit={setEditingCredential} />
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingCredential ? 'Edit credential' : 'Add credential'}>
        <CredentialForm credential={editingCredential ?? undefined} onSuccess={closeModal} />
      </Modal>
    </div>
  )
}
