import { useTranslation } from 'react-i18next'
import { useDocuments } from '../hooks/useDocuments'
import { DocumentCard } from './DocumentCard'

interface DocumentListProps {
  onNotify: (message: string) => void
}

export function DocumentList({ onNotify }: DocumentListProps) {
  const { t } = useTranslation()
  const { data, isLoading, isError } = useDocuments()

  if (isLoading) {
    return <p className="text-sm text-muted">{t('documents.loading')}</p>
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
        {t('documents.loadError')}
      </div>
    )
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-line px-6 py-10 text-center">
        <p className="text-sm font-medium text-ink">{t('documents.emptyTitle')}</p>
        <p className="text-sm text-muted">{t('documents.emptyBody')}</p>
      </div>
    )
  }

  const count = data.data.length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <span className="font-mono text-xs uppercase tracking-wide text-muted">
          {count === 1 ? t('documents.countSingular', { count }) : t('documents.countPlural', { count })}
        </span>
        <span className="h-px flex-1 bg-line" />
      </div>
      <ul className="flex flex-col gap-3">
        {data.data.map((doc) => (
          <DocumentCard key={doc.id} document={doc} onNotify={onNotify} />
        ))}
      </ul>
    </div>
  )
}
