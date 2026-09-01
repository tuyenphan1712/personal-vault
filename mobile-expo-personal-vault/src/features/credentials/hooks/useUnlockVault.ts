import { useState } from 'react'
import { useAuthStore } from '@/src/features/auth'
import { deriveEncryptionKey } from '@/src/shared/lib/crypto/cryptoAdapter'
import { setEncryptionKey } from '@/src/shared/lib/crypto/keyStore'

/** Re-derives the credential encryption key after it was lost (e.g. app restart) — see
 *  auth/CONTEXT.md for why the key can't be restored from the session alone. */
export function useUnlockVault() {
  const userId = useAuthStore((state) => state.user?.id)
  const [isUnlocking, setIsUnlocking] = useState(false)

  const unlock = async (password: string) => {
    if (!userId) {
      return
    }
    setIsUnlocking(true)
    try {
      const key = await deriveEncryptionKey(password, userId)
      setEncryptionKey(key)
    } finally {
      setIsUnlocking(false)
    }
  }

  return { unlock, isUnlocking }
}
