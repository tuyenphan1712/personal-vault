import { useEffect } from 'react'
import { registerAuthHandlers } from '@/src/shared/lib/api/axios'
import { setAccessToken } from '@/src/shared/lib/auth/tokenStore'
import { clearRefreshToken, getRefreshToken, setRefreshToken } from '@/src/shared/lib/storage/secureStorage'
import { setEncryptionKey } from '@/src/shared/lib/crypto/keyStore'
import { authService } from '../services/auth.service'
import { useAuthStore } from '../stores/auth.store'

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken()
  if (!refreshToken) {
    return null
  }
  try {
    const data = await authService.refresh(refreshToken)
    setAccessToken(data.accessToken)
    await setRefreshToken(data.refreshToken)
    return data.accessToken
  } catch {
    return null
  }
}

// Registers axios auth handlers and restores the session from the stored refresh token on app start.
export function useSessionBootstrap(): void {
  const setSession = useAuthStore((state) => state.setSession)
  const clearSession = useAuthStore((state) => state.clearSession)
  const setSessionLoading = useAuthStore((state) => state.setSessionLoading)

  useEffect(() => {
    registerAuthHandlers({
      refreshAccessToken,
      handleSessionExpired: () => {
        setAccessToken(null)
        setEncryptionKey(null)
        clearRefreshToken()
        clearSession()
      },
    })

    let cancelled = false

    async function bootstrap() {
      const newAccessToken = await refreshAccessToken()
      if (cancelled) return

      if (!newAccessToken) {
        clearSession()
        setSessionLoading(false)
        return
      }

      try {
        const user = await authService.getMe()
        if (cancelled) return
        setSession(user)
      } catch {
        if (cancelled) return
        setAccessToken(null)
        await clearRefreshToken()
        clearSession()
      } finally {
        if (!cancelled) {
          setSessionLoading(false)
        }
      }
    }

    bootstrap()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
