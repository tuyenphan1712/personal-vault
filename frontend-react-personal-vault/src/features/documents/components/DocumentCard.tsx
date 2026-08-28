import { Link } from 'react-router'
import { ROUTES } from '@/routes/routes'
import { Button } from '@/shared/components/Button'
import { useDeleteDocument } from '../hooks/useDeleteDocument'
import { useDownloadDocument } from '../hooks/useDownloadDocument'
import { getDocumentTypeLabel, type Document } from '../types/document.types'

interface DocumentCardProps {
  document: Document
  onNotify: (message: string) => void
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  const kb = bytes / 1024
  if (kb < 1024) {
    return `${kb.toFixed(0)} KB`
  }
  return `${(kb / 1024).toFixed(1)} MB`
}

export function DocumentCard({ document: doc, onNotify }: DocumentCardProps) {
  const deleteDocument = useDeleteDocument()
  const { download, isDownloading } = useDownloadDocument()

  return (
    <li className="grid grid-cols-1 gap-4 rounded-xl border border-line bg-surface p-5 shadow-sm transition-shadow hover:shadow-md md:grid-cols-[44px_1fr_auto] md:items-center">
      <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-primary-soft font-serif text-lg text-primary-dark">
        {doc.title.charAt(0).toUpperCase()}
      </span>
      <div className="min-w-0">
        <Link to={ROUTES.DOCUMENT_DETAIL(doc.id)} className="font-medium text-ink hover:underline">
          {doc.title}
        </Link>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 font-mono text-xs text-muted">
          {doc.docType ? <span>{getDocumentTypeLabel(doc.docType)}</span> : null}
          <span>{formatFileSize(doc.fileSize)}</span>
          <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      <div className="-ml-2 flex gap-1 md:ml-0">
        <Button
          variant="secondary"
          isLoading={isDownloading}
          onClick={() => download(doc.id, doc.title)}
        >
          Download
        </Button>
        <Button
          variant="danger"
          isLoading={deleteDocument.isPending}
          onClick={() =>
            deleteDocument.mutate(doc.id, {
              onSuccess: () => onNotify(`${doc.title} deleted.`),
            })
          }
        >
          Delete
        </Button>
      </div>
    </li>
  )
}
