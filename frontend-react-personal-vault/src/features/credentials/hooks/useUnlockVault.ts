import { useState } from 'react'
import { useAuthStore } from '@/features/auth'
import { deriveEncryptionKey } from '@/shared/lib/crypto'
import { setEncryptionKey } from '@/shared/lib/keyStore'

/** Re-derives the credential encryption key after it was lost (e.g. a page reload) — see
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
