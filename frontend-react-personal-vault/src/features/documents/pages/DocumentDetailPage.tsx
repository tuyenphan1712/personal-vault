import { useParams } from 'react-router'
import { ROUTES } from '@/routes/routes'
import { BackLink } from '@/shared/components/BackLink'
import { DocumentDetail } from '../components/DocumentDetail'
import { useDocument } from '../hooks/useDocument'

export function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: document, isLoading, isError } = useDocument(id ?? '')

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <BackLink to={ROUTES.DOCUMENTS}>Back to documents</BackLink>
      <div className="mt-6">
        {isLoading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : isError || !document ? (
          <p className="text-sm text-danger">Document not found.</p>
        ) : (
          <DocumentDetail document={document} />
        )}
      </div>
    </div>
  )
}
