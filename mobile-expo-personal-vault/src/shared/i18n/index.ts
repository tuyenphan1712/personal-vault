import AsyncStorage from '@react-native-async-storage/async-storage'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

import authEn from './locales/en/auth.json'
import commonEn from './locales/en/common.json'
import credentialsEn from './locales/en/credentials.json'
import documentsEn from './locales/en/documents.json'
import homeEn from './locales/en/home.json'
import notificationsEn from './locales/en/notifications.json'
import profileEn from './locales/en/profile.json'
import sessionsEn from './locales/en/sessions.json'
import settingsEn from './locales/en/settings.json'
import authVi from './locales/vi/auth.json'
import commonVi from './locales/vi/common.json'
import credentialsVi from './locales/vi/credentials.json'
import documentsVi from './locales/vi/documents.json'
import homeVi from './locales/vi/home.json'
import notificationsVi from './locales/vi/notifications.json'
import profileVi from './locales/vi/profile.json'
import sessionsVi from './locales/vi/sessions.json'
import settingsVi from './locales/vi/settings.json'

export const SUPPORTED_LANGUAGES = ['vi', 'en'] as const
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

const LANGUAGE_STORAGE_KEY = 'vault-language'

const NAMESPACES = ['common', 'auth', 'credentials', 'documents', 'profile', 'settings', 'home', 'notifications', 'sessions'] as const

// NOTE: i18next.init below is synchronous and always starts with lng: 'vi', because
// AsyncStorage has no synchronous read API — there is no way to know the persisted
// language before the first render. The root layout's hydration gate (Task 6) awaits
// loadPersistedLanguage() before rendering themed content, so a persisted 'en' choice
// is applied before anything is shown and never flashes as 'vi' first.
i18next.use(initReactI18next).init({
  lng: 'vi',
  fallbackLng: 'vi',
  defaultNS: 'common',
  ns: NAMESPACES,
  resources: {
    vi: {
      common: commonVi,
      auth: authVi,
      credentials: credentialsVi,
      documents: documentsVi,
      profile: profileVi,
      settings: settingsVi,
      home: homeVi,
      notifications: notificationsVi,
      sessions: sessionsVi,
    },
    en: {
      common: commonEn,
      auth: authEn,
      credentials: credentialsEn,
      documents: documentsEn,
      profile: profileEn,
      settings: settingsEn,
      home: homeEn,
      notifications: notificationsEn,
      sessions: sessionsEn,
    },
  },
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
})

export async function loadPersistedLanguage(): Promise<void> {
  const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
  if (stored && SUPPORTED_LANGUAGES.includes(stored as SupportedLanguage)) {
    await i18next.changeLanguage(stored)
  }
}

export async function setLanguage(language: SupportedLanguage): Promise<void> {
  await i18next.changeLanguage(language)
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language)
}

export default i18next
