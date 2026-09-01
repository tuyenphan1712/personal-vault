import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/Button'
import { Modal } from '@/shared/components/Modal'
import type { AdminUser } from '../types/admin.types'

interface DeleteUserDialogProps {
  user: AdminUser | null
  isDeleting: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteUserDialog({ user, isDeleting, onConfirm, onCancel }: DeleteUserDialogProps) {
  const { t } = useTranslation()

  return (
    <Modal isOpen={user !== null} onClose={onCancel} title={t('admin.deleteDialog.title')}>
      <p className="text-sm text-muted">{t('admin.deleteDialog.body', { name: user?.fullName, phone: user?.phone })}</p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button variant="danger" isLoading={isDeleting} onClick={onConfirm}>
          {t('admin.deleteDialog.confirm')}
        </Button>
      </div>
    </Modal>
  )
}
