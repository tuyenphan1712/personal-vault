import { useDocuments } from '../hooks/useDocuments'
import { DocumentCard } from './DocumentCard'

interface DocumentListProps {
  onNotify: (message: string) => void
}

export function DocumentList({ onNotify }: DocumentListProps) {
  const { data, isLoading, isError } = useDocuments()

  if (isLoading) {
    return <p className="text-sm text-muted">Loading documents…</p>
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
        Couldn't load your documents. Try again.
      </div>
    )
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-line px-6 py-10 text-center">
        <p className="text-sm font-medium text-ink">No documents yet</p>
        <p className="text-sm text-muted">Upload your first private document to get started.</p>
      </div>
    )
  }

  const count = data.data.length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <span className="font-mono text-xs uppercase tracking-wide text-muted">
          {count} {count === 1 ? 'document' : 'documents'}
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
