import { useMutation, useQueryClient } from '@tanstack/react-query'
// Imported from the concrete service file, not the `credentials` barrel: that barrel also
// re-exports screens which import `useAuthStore` from this (`auth`) feature's own barrel,
// and this feature's barrel exports `ChangePasswordForm` (which needs this hook) — going
// through both barrels would form an auth -> credentials -> auth circular require.
import { credentialService } from '@/src/features/credentials/services/credential.service'
import { auditLogKeys } from '@/src/features/audit-log'
import { useBiometricStore } from '@/src/features/settings/stores/biometric.store'
import { MAX_PAGE_SIZE } from '@/src/config/constants'
import { clearBiometricCredential } from '@/src/shared/lib/auth/biometricCredentialStore'
import { decryptCredential, deriveEncryptionKey, encryptCredential } from '@/src/shared/lib/crypto/cryptoAdapter'
import { setEncryptionKey } from '@/src/shared/lib/crypto/keyStore'
import { getRefreshToken } from '@/src/shared/lib/storage/secureStorage'
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
  const queryClient = useQueryClient()

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
            encryptedPassword: await encryptCredential(await decryptCredential(credential.encryptedPassword, oldKey), newKey),
            encryptedPin: credential.encryptedPin
              ? await encryptCredential(await decryptCredential(credential.encryptedPin, oldKey), newKey)
              : null,
            ciphertextVersion: credential.ciphertextVersion,
          })),
        )
      } catch {
        throw new IncorrectCurrentPasswordError()
      }

      const currentRefreshToken = await getRefreshToken()
      await authService.changePassword({ currentPassword, newPassword, currentRefreshToken, credentials: reencrypted })
      setEncryptionKey(newKey)
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: auditLogKeys.all })
      // The wrapped biometric secret was derived from the now-stale password — never leave it
      // usable after a password change; the user must re-enable biometrics explicitly.
      await clearBiometricCredential()
      useBiometricStore.getState().setEnabled(false)
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
