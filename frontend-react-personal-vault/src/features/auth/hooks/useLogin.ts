import { useMutation } from '@tanstack/react-query'
import { deriveEncryptionKey } from '@/shared/lib/crypto'
import { setEncryptionKey } from '@/shared/lib/keyStore'
import { setAccessToken } from '@/shared/lib/tokenStore'
import { authService } from '../services/auth.service'
import { useAuthStore } from '../stores/auth.store'
import type { LoginRequest } from '../types/auth.types'

export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession)

  return useMutation({
    mutationFn: async (payload: LoginRequest) => {
      const result = await authService.login(payload)
      const key = await deriveEncryptionKey(payload.password, result.user.id)

      setAccessToken(result.accessToken)
      setEncryptionKey(key)
      setSession(result.user)

      return result
    },
  })
}
