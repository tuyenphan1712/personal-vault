import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/Button'
import { decryptValue } from '@/shared/lib/crypto'
import { getEncryptionKey } from '@/shared/lib/keyStore'

interface PinRevealProps {
  encryptedPin: string
  onUnlockNeeded: () => void
}

export function PinReveal({ encryptedPin, onUnlockNeeded }: PinRevealProps) {
  const { t } = useTranslation()
  const [revealed, setRevealed] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastSeenCiphertext, setLastSeenCiphertext] = useState(encryptedPin)

  // The encrypted value changes after an edit — any previously revealed plaintext is now stale
  // (and wouldn't even decrypt against the new ciphertext), so hide it again.
  if (lastSeenCiphertext !== encryptedPin) {
    setLastSeenCiphertext(encryptedPin)
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
      setRevealed(await decryptValue(encryptedPin, key))
    } catch {
      setError(t('credentials.decryptError'))
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted">{t('credentials.pinLabel')}</span>
      <div className="flex items-center gap-2">
        <code className="flex-1 truncate rounded-md bg-mist-soft px-3 py-1.5 font-mono text-sm tracking-wide text-mist">
          {revealed ?? '••••'}
        </code>
        <button
          type="button"
          onClick={handleToggle}
          aria-label={revealed ? t('credentials.hidePinAria') : t('credentials.showPinAria')}
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
