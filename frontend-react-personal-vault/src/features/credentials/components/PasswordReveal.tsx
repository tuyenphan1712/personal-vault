import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/Button'
import { decryptValue } from '@/shared/lib/crypto'
import { getEncryptionKey } from '@/shared/lib/keyStore'

interface PasswordRevealProps {
  encryptedPassword: string
  onUnlockNeeded: () => void
  onNotify: (message: string) => void
}

export function PasswordReveal({ encryptedPassword, onUnlockNeeded, onNotify }: PasswordRevealProps) {
  const { t } = useTranslation()
  const [revealed, setRevealed] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [lastSeenCiphertext, setLastSeenCiphertext] = useState(encryptedPassword)

  // The encrypted value changes after an edit — any previously revealed plaintext is now stale
  // (and wouldn't even decrypt against the new ciphertext), so hide it again.
  if (lastSeenCiphertext !== encryptedPassword) {
    setLastSeenCiphertext(encryptedPassword)
    setRevealed(null)
    setError(null)
  }

  const handleToggle = async () => {
    if (revealed) {
      setRevealed(null)
      return
    }
    setError(null)
    const key = getEncryptionKey()
    if (!key) {
      setError(t('credentials.vaultLocked'))
      return
    }
    try {
      setRevealed(await decryptValue(encryptedPassword, key))
    } catch {
      setError(t('credentials.decryptError'))
    }
  }

  const handleCopy = async () => {
    if (!revealed) {
      return
    }
    await navigator.clipboard.writeText(revealed)
    setCopied(true)
    onNotify(t('credentials.copiedToast'))
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted">{t('credentials.passwordLabel')}</span>
      <div className="flex items-center gap-2">
        <code className="flex-1 truncate rounded-md bg-mist-soft px-3 py-1.5 font-mono text-sm tracking-wide text-mist">
          {revealed ?? '••••••••••••'}
        </code>
        {revealed ? (
          <button
            type="button"
            onClick={handleCopy}
            aria-label={t('credentials.copyPasswordAria')}
            className="flex-shrink-0 rounded-md border border-line p-2 text-muted transition-colors hover:bg-surface-hover hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </button>
        ) : null}
        <button
          type="button"
          onClick={handleToggle}
          aria-label={revealed ? t('common.hidePassword') : t('common.showPassword')}
          aria-pressed={revealed !== null}
          className="flex-shrink-0 rounded-md border border-line p-2 text-muted transition-colors hover:bg-surface-hover hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {revealed ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {error ? (
        <div className="flex items-center gap-2">
          <p className="text-sm text-danger">{error}</p>
          <Button variant="secondary" onClick={onUnlockNeeded}>
            {t('credentials.unlockAgain')}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 7 11 7a13.16 13.16 0 0 1-3.53 4.31M6.61 6.61A13.14 13.14 0 0 0 1 11s4 7 11 7a9.16 9.16 0 0 0 5.39-1.61M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <path d="M1 1l22 22" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}
