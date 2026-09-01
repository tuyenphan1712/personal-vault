import { useMutation, useQueryClient } from '@tanstack/react-query'
import { setAccessToken } from '@/src/shared/lib/auth/tokenStore'
import { clearRefreshToken, getRefreshToken } from '@/src/shared/lib/storage/secureStorage'
import { setEncryptionKey } from '@/src/shared/lib/crypto/keyStore'
import { authService } from '../services/auth.service'
import { useAuthStore } from '../stores/auth.store'

export function useLogout() {
  const queryClient = useQueryClient()
  const clearSession = useAuthStore((state) => state.clearSession)

  return useMutation({
    mutationFn: async () => {
      const refreshToken = await getRefreshToken()
      if (refreshToken) {
        await authService.logout(refreshToken)
      }
    },
    onSettled: async () => {
      setAccessToken(null)
      setEncryptionKey(null)
      await clearRefreshToken()
      clearSession()
      queryClient.clear()
    },
  })
}
