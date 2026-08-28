import { Button } from '@/shared/components/Button'
import { useDownloadDocument } from '../hooks/useDownloadDocument'
import type { Document } from '../types/document.types'

interface DocumentDetailProps {
  document: Document
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

export function DocumentDetail({ document: doc }: DocumentDetailProps) {
  const { download, isDownloading } = useDownloadDocument()

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-primary-soft font-serif text-lg text-primary-dark">
          {doc.title.charAt(0).toUpperCase()}
        </span>
        <div>
          <h1 className="font-serif text-xl font-normal text-ink">{doc.title}</h1>
          {doc.docType ? <p className="font-mono text-sm uppercase text-muted">{doc.docType}</p> : null}
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-3 font-mono text-sm text-muted">
        <dt>File size</dt>
        <dd>{formatFileSize(doc.fileSize)}</dd>
        <dt>Type</dt>
        <dd>{doc.mimeType}</dd>
        <dt>Uploaded</dt>
        <dd>{new Date(doc.createdAt).toLocaleString()}</dd>
      </dl>
      <Button isLoading={isDownloading} onClick={() => download(doc.id, doc.title)}>
        Download
      </Button>
    </div>
  )
}
