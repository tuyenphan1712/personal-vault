import { useEffect, useState } from 'react'
import { loadPersistedLanguage } from '@/src/shared/i18n'
import { useThemeStore } from '@/src/shared/theme/theme.store'

/**
 * Gates first paint until fonts are loaded, the persisted theme mode has
 * hydrated from AsyncStorage, and the persisted language has been applied.
 * Returns `true` only once all three signals have settled.
 */
export function useAppReady(fontsLoaded: boolean): boolean {
  const hasThemeHydrated = useThemeStore((state) => state.hasHydrated)
  const [isLanguageLoaded, setIsLanguageLoaded] = useState(false)

  useEffect(() => {
    let isMounted = true

    const markLoaded = () => {
      if (isMounted) {
        setIsLanguageLoaded(true)
      }
    }

    loadPersistedLanguage().then(markLoaded, markLoaded)

    return () => {
      isMounted = false
    }
  }, [])

  return fontsLoaded && hasThemeHydrated && isLanguageLoaded
}
