import { useState } from 'react'
import { ROUTES } from '@/routes/routes'
import { BackLink } from '@/shared/components/BackLink'
import { Button } from '@/shared/components/Button'
import { Modal } from '@/shared/components/Modal'
import { Toast } from '@/shared/components/Toast'
import { DocumentList } from '../components/DocumentList'
import { DocumentUploadForm } from '../components/DocumentUploadForm'
import { useToast } from '../hooks/useToast'

export function DocumentListPage() {
  const [isUploading, setIsUploading] = useState(false)
  const { message: toastMessage, notify } = useToast()

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10">
      <BackLink to={ROUTES.DASHBOARD}>Back to dashboard</BackLink>
      <div className="flex items-start justify-between gap-4 border-b border-line pb-6">
        <div>
          <h1 className="font-serif text-3xl font-light tracking-tight text-ink">Documents</h1>
          <p className="mt-1 text-sm text-muted">Private documents, stored securely and only reachable by you.</p>
        </div>
        <Button className="flex-shrink-0" onClick={() => setIsUploading(true)}>
          Upload document
        </Button>
      </div>
      <DocumentList onNotify={notify} />
      <Modal isOpen={isUploading} onClose={() => setIsUploading(false)} title="Upload document">
        <DocumentUploadForm
          onSuccess={(message) => {
            setIsUploading(false)
            notify(message)
          }}
        />
      </Modal>
      <Toast message={toastMessage} />
    </div>
  )
}
