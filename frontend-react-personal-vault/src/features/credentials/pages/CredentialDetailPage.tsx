import { useState } from 'react'
import { useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/routes/routes'
import { BackLink } from '@/shared/components/BackLink'
import { Toast } from '@/shared/components/Toast'
import { TopBar } from '@/shared/components/TopBar'
import { getEncryptionKey, setEncryptionKey } from '@/shared/lib/keyStore'
import { CredentialDetail } from '../components/CredentialDetail'
import { UnlockVaultPrompt } from '../components/UnlockVaultPrompt'
import { useCredential } from '../hooks/useCredential'
import { useToast } from '../hooks/useToast'

export function CredentialDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const [isUnlocked, setIsUnlocked] = useState(() => getEncryptionKey() !== null)
  const { data: credential, isLoading, isError } = useCredential(id ?? '')
  const { message: toastMessage, notify } = useToast()

  const handleUnlockNeeded = () => {
    setEncryptionKey(null)
    setIsUnlocked(false)
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <TopBar />
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <BackLink to={ROUTES.CREDENTIALS}>{t('credentials.backToCredentials')}</BackLink>
        <div className="mt-6">
          {!isUnlocked ? (
            <UnlockVaultPrompt onUnlocked={() => setIsUnlocked(true)} />
          ) : isLoading ? (
            <p className="text-sm text-muted">{t('common.loading')}</p>
          ) : isError || !credential ? (
            <p className="text-sm text-danger">{t('credentials.notFound')}</p>
          ) : (
            <CredentialDetail credential={credential} onUnlockNeeded={handleUnlockNeeded} onNotify={notify} />
          )}
        </div>
        <Toast message={toastMessage} />
      </div>
    </div>
  )
}
