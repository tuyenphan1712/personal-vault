import { useTranslation } from 'react-i18next'

// Looks up the display label for a docType value. Known picker category values
// resolve via `docType.categories.<value>`; a user-typed free-text "Other" value
// has no translation key, so it falls back to being displayed as-is via `defaultValue`.
export function useDocTypeLabel(): (docType: string | null) => string {
  const { t } = useTranslation('documents')

  return (docType: string | null) => {
    if (!docType) return t('docType.uncategorized')
    return t(`docType.categories.${docType}`, { defaultValue: docType })
  }
}
