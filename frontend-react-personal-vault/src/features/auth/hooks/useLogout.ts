import { useMutation, useQueryClient } from '@tanstack/react-query'
import { setEncryptionKey } from '@/shared/lib/keyStore'
import { setAccessToken } from '@/shared/lib/tokenStore'
import { authService } from '../services/auth.service'
import { useAuthStore } from '../stores/auth.store'

export function useLogout() {
  const clearSession = useAuthStore((state) => state.clearSession)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      setAccessToken(null)
      setEncryptionKey(null)
      clearSession()
      queryClient.clear()
    },
  })
}
