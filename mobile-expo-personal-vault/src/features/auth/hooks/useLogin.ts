import { useMutation } from '@tanstack/react-query'
import { setAccessToken } from '@/src/shared/lib/auth/tokenStore'
import { setRefreshToken } from '@/src/shared/lib/storage/secureStorage'
import { deriveEncryptionKey } from '@/src/shared/lib/crypto/cryptoAdapter'
import { setEncryptionKey } from '@/src/shared/lib/crypto/keyStore'
import { authService } from '../services/auth.service'
import { useAuthStore } from '../stores/auth.store'

export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession)

  return useMutation({
    mutationFn: async ({ phone, password }: { phone: string; password: string }) => {
      const data = await authService.login(phone, password)
      const encryptionKey = await deriveEncryptionKey(password, data.user.id)

      setAccessToken(data.accessToken)
      await setRefreshToken(data.refreshToken)
      setEncryptionKey(encryptionKey)
      setSession(data.user)

      return data
    },
  })
}
