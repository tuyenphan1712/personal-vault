import { useEffect } from 'react'
import { registerAuthHandlers } from '@/shared/lib/axios'
import { setAccessToken } from '@/shared/lib/tokenStore'
import { authService } from '../services/auth.service'
import { useAuthStore } from '../stores/auth.store'

/**
 * Runs once at app startup: wires the axios 401 -> refresh -> retry handlers, then attempts a
 * silent refresh from the web refresh cookie so a page reload keeps the user signed in.
 *
 * Note: a silent refresh restores the access token and user session, but NOT the credential
 * encryption key — that can only be derived from the login password (see auth/CONTEXT.md), which
 * isn't available after a reload. The credentials feature handles a missing key by prompting the
 * user to unlock the vault again.
 */
export function useSessionBootstrap() {
  const setSession = useAuthStore((state) => state.setSession)
  const clearSession = useAuthStore((state) => state.clearSession)
  const setSessionLoading = useAuthStore((state) => state.setSessionLoading)

  useEffect(() => {
    registerAuthHandlers({
      refreshAccessToken: async () => {
        try {
          const result = await authService.refresh()
          setAccessToken(result.accessToken)
          return result.accessToken
        } catch {
          return null
        }
      },
      handleSessionExpired: () => {
        setAccessToken(null)
        clearSession()
      },
    })

    let cancelled = false

    async function bootstrap() {
      try {
        const result = await authService.refresh()
        setAccessToken(result.accessToken)
        const user = await authService.me()
        if (!cancelled) {
          setSession(user)
        }
      } catch {
        if (!cancelled) {
          clearSession()
        }
      } finally {
        if (!cancelled) {
          setSessionLoading(false)
        }
      }
    }

    void bootstrap()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
