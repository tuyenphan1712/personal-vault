import { useMutation } from '@tanstack/react-query'
import { credentialService } from '@/features/credentials'
import { MAX_PAGE_SIZE } from '@/config/constants'
import { decryptValue, deriveEncryptionKey, encryptValue } from '@/shared/lib/crypto'
import { setEncryptionKey } from '@/shared/lib/keyStore'
import { authService } from '../services/auth.service'
import { useAuthStore } from '../stores/auth.store'
import type { ChangePasswordCredentialUpdate } from '../types/auth.types'

export class IncorrectCurrentPasswordError extends Error {
  constructor() {
    super('Current password is incorrect')
    this.name = 'IncorrectCurrentPasswordError'
  }
}

interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}

export function useChangePassword() {
  const userId = useAuthStore((state) => state.user?.id)

  return useMutation({
    mutationFn: async ({ currentPassword, newPassword }: ChangePasswordInput) => {
      if (!userId) {
        throw new Error('No active session')
      }

      const [oldKey, newKey] = await Promise.all([
        deriveEncryptionKey(currentPassword, userId),
        deriveEncryptionKey(newPassword, userId),
      ])

      const owned = await fetchAllOwnedCredentials()

      let reencrypted: ChangePasswordCredentialUpdate[]
      try {
        reencrypted = await Promise.all(
          owned.map(async (credential) => ({
            id: credential.id,
            encryptedPassword: await encryptValue(await decryptValue(credential.encryptedPassword, oldKey), newKey),
            encryptedPin: credential.encryptedPin
              ? await encryptValue(await decryptValue(credential.encryptedPin, oldKey), newKey)
              : null,
            ciphertextVersion: credential.ciphertextVersion,
          })),
        )
      } catch {
        throw new IncorrectCurrentPasswordError()
      }

      await authService.changePassword({ currentPassword, newPassword, credentials: reencrypted })
      setEncryptionKey(newKey)
    },
  })
}

async function fetchAllOwnedCredentials() {
  const all: Awaited<ReturnType<typeof credentialService.getAll>>['data'] = []
  let page = 1
  let totalPages = 1
  do {
    const { data, meta } = await credentialService.getAll({ page, limit: MAX_PAGE_SIZE })
    all.push(...data)
    totalPages = meta?.totalPages ?? 1
    page += 1
  } while (page <= totalPages)
  return all
}
