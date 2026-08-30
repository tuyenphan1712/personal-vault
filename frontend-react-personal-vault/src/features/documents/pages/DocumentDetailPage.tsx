import { useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/routes/routes'
import { BackLink } from '@/shared/components/BackLink'
import { TopBar } from '@/shared/components/TopBar'
import { DocumentDetail } from '../components/DocumentDetail'
import { useDocument } from '../hooks/useDocument'

export function DocumentDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const { data: document, isLoading, isError } = useDocument(id ?? '')

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <TopBar />
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <BackLink to={ROUTES.DOCUMENTS}>{t('documents.backToDocuments')}</BackLink>
        <div className="mt-6">
          {isLoading ? (
            <p className="text-sm text-muted">{t('common.loading')}</p>
          ) : isError || !document ? (
            <p className="text-sm text-danger">{t('documents.notFound')}</p>
          ) : (
            <DocumentDetail document={document} />
          )}
        </div>
      </div>
    </div>
  )
}
