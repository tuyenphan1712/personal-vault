import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { setAccessToken } from '@/src/shared/lib/auth/tokenStore'
import { setRefreshToken } from '@/src/shared/lib/storage/secureStorage'
import { deriveEncryptionKey } from '@/src/shared/lib/crypto/cryptoAdapter'
import { setEncryptionKey, setIsDerivingKey } from '@/src/shared/lib/crypto/keyStore'
import { authService } from '../services/auth.service'
import { useAuthStore } from '../stores/auth.store'
import { useLastAccountStore } from '../stores/lastAccount.store'

export type LoginStage = 'idle' | 'signingIn' | 'derivingKey'

export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession)
  const [stage, setStage] = useState<LoginStage>('idle')

  const mutation = useMutation({
    mutationFn: async ({ phone, password }: { phone: string; password: string }) => {
      // Timing-only diagnostics (no phone/password/token values) so a slow login can be traced to
      // its actual stage from the Metro/device log instead of guessing — see MOBILE-PROJECT-RULES.md
      // §5 "never log ... request bodies containing secrets". Remove once the 2-5min reports are root-caused.
      const t0 = Date.now()

      setStage('signingIn')
      const data = await authService.login(phone, password)
      console.log(`[login] signIn took ${Date.now() - t0}ms`)

      // Set the session as soon as sign-in succeeds instead of waiting on key derivation below —
      // the credential key isn't needed until a screen actually renders decrypted credential data,
      // and those screens (CredentialListScreen/CredentialDetailScreen) already know how to wait
      // for `isDerivingKey` instead of blocking the whole app behind a multi-second/minute PBKDF2 run.
      const t2 = Date.now()
      setAccessToken(data.accessToken)
      await setRefreshToken(data.refreshToken)
      setSession(data.user)
      useLastAccountStore.getState().setPhone(data.user.phone)
      console.log(`[login] session persist took ${Date.now() - t2}ms, total so far ${Date.now() - t0}ms`)

      // The slow part: 100k rounds of pure-JS PBKDF2 on Hermes commonly takes 10-15s on a real
      // device (no JIT, unlike the web client's hardware-accelerated Web Crypto API) — surface
      // it as its own stage so the UI doesn't look stuck once the (fast) network call finishes.
      setStage('derivingKey')
      setIsDerivingKey(true)
      const t1 = Date.now()
      try {
        const encryptionKey = await deriveEncryptionKey(password, data.user.id)
        setEncryptionKey(encryptionKey)
        console.log(`[login] deriveEncryptionKey took ${Date.now() - t1}ms`)
      } finally {
        setIsDerivingKey(false)
      }

      return data
    },
    onSettled: () => setStage('idle'),
  })

  return { ...mutation, stage }
}
