import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/Button'
import { Modal } from '@/shared/components/Modal'
import type { Session } from '../types/session.types'

interface RevokeSessionDialogProps {
  session: Session | null
  isRevoking: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function RevokeSessionDialog({ session, isRevoking, onConfirm, onCancel }: RevokeSessionDialogProps) {
  const { t } = useTranslation()

  return (
    <Modal isOpen={session !== null} onClose={onCancel} title={t('sessions.revokeDialog.title')}>
      <p className="text-sm text-muted">
        {t('sessions.revokeDialog.body', { device: session?.deviceInfo ?? t(`sessions.clientType.${session?.clientType}`) })}
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button variant="danger" isLoading={isRevoking} onClick={onConfirm}>
          {t('sessions.revokeDialog.confirm')}
        </Button>
      </div>
    </Modal>
  )
}
