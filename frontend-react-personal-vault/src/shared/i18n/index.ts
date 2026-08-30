import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import ja from './locales/ja.json'
import vi from './locales/vi.json'

export const SUPPORTED_LANGUAGES = ['vi', 'en', 'ja'] as const
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

const STORAGE_KEY = 'personal-vault:lang'
const DEFAULT_LANGUAGE: SupportedLanguage = 'vi'

const INTL_LOCALES: Record<SupportedLanguage, string> = {
  vi: 'vi-VN',
  en: 'en-US',
  ja: 'ja-JP',
}

function isSupportedLanguage(value: string | null): value is SupportedLanguage {
  return value !== null && (SUPPORTED_LANGUAGES as readonly string[]).includes(value)
}

function getInitialLanguage(): SupportedLanguage {
  const stored = localStorage.getItem(STORAGE_KEY)
  return isSupportedLanguage(stored) ? stored : DEFAULT_LANGUAGE
}

export function setLanguage(language: SupportedLanguage): void {
  localStorage.setItem(STORAGE_KEY, language)
  void i18n.changeLanguage(language)
}

export function toIntlLocale(language: string): string {
  return isSupportedLanguage(language) ? INTL_LOCALES[language] : INTL_LOCALES[DEFAULT_LANGUAGE]
}

void i18n.use(initReactI18next).init({
  lng: getInitialLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  resources: {
    vi: { translation: vi },
    en: { translation: en },
    ja: { translation: ja },
  },
  interpolation: { escapeValue: false },
})

export default i18n
