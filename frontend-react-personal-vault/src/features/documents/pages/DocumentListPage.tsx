import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/routes/routes'
import { BackLink } from '@/shared/components/BackLink'
import { Button } from '@/shared/components/Button'
import { Modal } from '@/shared/components/Modal'
import { Toast } from '@/shared/components/Toast'
import { TopBar } from '@/shared/components/TopBar'
import { DocumentList } from '../components/DocumentList'
import { DocumentUploadForm } from '../components/DocumentUploadForm'
import { useToast } from '../hooks/useToast'

export function DocumentListPage() {
  const { t } = useTranslation()
  const [isUploading, setIsUploading] = useState(false)
  const { message: toastMessage, notify } = useToast()

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <TopBar />
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
        <BackLink to={ROUTES.DASHBOARD}>{t('common.backToDashboard')}</BackLink>
        <div className="flex items-start justify-between gap-4 border-b border-line pb-6">
          <div>
            <h1 className="font-serif text-3xl font-light tracking-tight text-ink">{t('documents.pageTitle')}</h1>
            <p className="mt-1 text-sm text-muted">{t('documents.pageSubtitle')}</p>
          </div>
          <Button className="flex-shrink-0" onClick={() => setIsUploading(true)}>
            {t('documents.uploadButton')}
          </Button>
        </div>
        <DocumentList onNotify={notify} />
        <Modal isOpen={isUploading} onClose={() => setIsUploading(false)} title={t('documents.modalTitle')}>
          <DocumentUploadForm
            onSuccess={(message) => {
              setIsUploading(false)
              notify(message)
            }}
          />
        </Modal>
        <Toast message={toastMessage} />
      </div>
    </div>
  )
}
