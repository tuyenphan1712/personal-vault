import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/Button'
import { toIntlLocale } from '@/shared/i18n'
import { useDeleteCredential } from '../hooks/useDeleteCredential'
import type { Credential } from '../types/credential.types'
import { PasswordReveal } from './PasswordReveal'

interface CredentialCardProps {
  credential: Credential
  onEdit: (credential: Credential) => void
  onUnlockNeeded: () => void
  onNotify: (message: string) => void
}

export function CredentialCard({ credential, onEdit, onUnlockNeeded, onNotify }: CredentialCardProps) {
  const { t, i18n } = useTranslation()
  const deleteCredential = useDeleteCredential()

  return (
    <li className="grid grid-cols-1 gap-4 rounded-xl border border-line bg-surface p-5 shadow-sm transition-shadow hover:shadow-md md:grid-cols-[44px_1fr_260px] md:items-start">
      <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-primary-soft font-serif text-lg text-primary-dark">
        {credential.platformName.charAt(0).toUpperCase()}
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-2">
          <p className="font-medium text-ink">{credential.platformName}</p>
          <span className="font-mono text-xs text-muted">
            {new Date(credential.updatedAt).toLocaleDateString(toIntlLocale(i18n.language))}
          </span>
        </div>
        <p className="mt-0.5 truncate font-mono text-sm text-muted">{credential.account}</p>
        {credential.note ? <p className="mt-2 text-sm text-muted">{credential.note}</p> : null}
        <div className="-ml-2 mt-3 flex gap-1">
          <Button variant="secondary" onClick={() => onEdit(credential)}>
            {t('common.edit')}
          </Button>
          <Button
            variant="danger"
            isLoading={deleteCredential.isPending}
            onClick={() =>
              deleteCredential.mutate(credential.id, {
                onSuccess: () => onNotify(t('credentials.deletedToast', { name: credential.platformName })),
              })
            }
          >
            {t('common.delete')}
          </Button>
        </div>
      </div>
      <PasswordReveal
        encryptedPassword={credential.encryptedPassword}
        onUnlockNeeded={onUnlockNeeded}
        onNotify={onNotify}
      />
    </li>
  )
}
