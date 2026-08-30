import { useTranslation } from 'react-i18next'
import { toIntlLocale } from '@/shared/i18n'
import type { Credential } from '../types/credential.types'
import { PasswordReveal } from './PasswordReveal'

interface CredentialDetailProps {
  credential: Credential
  onUnlockNeeded: () => void
  onNotify: (message: string) => void
}

export function CredentialDetail({ credential, onUnlockNeeded, onNotify }: CredentialDetailProps) {
  const { t, i18n } = useTranslation()

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-primary-soft font-serif text-lg text-primary-dark">
          {credential.platformName.charAt(0).toUpperCase()}
        </span>
        <div>
          <h1 className="font-serif text-xl font-normal text-ink">{credential.platformName}</h1>
          <p className="font-mono text-sm text-muted">{credential.account}</p>
        </div>
      </div>
      {credential.note ? <p className="text-sm text-muted">{credential.note}</p> : null}
      <PasswordReveal encryptedPassword={credential.encryptedPassword} onUnlockNeeded={onUnlockNeeded} onNotify={onNotify} />
      <p className="font-mono text-xs text-muted">
        {t('credentials.lastUpdated', { date: new Date(credential.updatedAt).toLocaleString(toIntlLocale(i18n.language)) })}
      </p>
    </div>
  )
}
