import { useTranslation } from 'react-i18next'
import { setLanguage, type SupportedLanguage } from '@/shared/i18n'

const LANGUAGE_OPTIONS: { value: SupportedLanguage; label: string; flag: string }[] = [
  { value: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'ja', label: '日本語', flag: '🇯🇵' },
]

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation()

  return (
    <select
      value={i18n.language}
      onChange={(event) => setLanguage(event.target.value as SupportedLanguage)}
      aria-label={t('common.languageLabel')}
      className="h-9 rounded-md border border-line bg-surface px-2 text-sm text-ink shadow-sm focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-primary"
    >
      {LANGUAGE_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label} {option.flag}
        </option>
      ))}
    </select>
  )
}
