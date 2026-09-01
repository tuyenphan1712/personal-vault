import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/features/auth'
import { ROUTES } from '@/routes/routes'
import { BackLink } from '@/shared/components/BackLink'
import { Toast } from '@/shared/components/Toast'
import { TopBar } from '@/shared/components/TopBar'
import { AdminUserTable } from '../components/AdminUserTable'
import { DeleteUserDialog } from '../components/DeleteUserDialog'
import { useDeleteUser } from '../hooks/useDeleteUser'
import { useToast } from '../hooks/useToast'
import type { AdminUser } from '../types/admin.types'

export function AdminUsersPage() {
  const { t } = useTranslation()
  const currentUserId = useAuthStore((state) => state.user?.id)
  const { message: toastMessage, notify } = useToast()
  const [userPendingDelete, setUserPendingDelete] = useState<AdminUser | null>(null)
  const deleteUser = useDeleteUser()

  const handleConfirmDelete = () => {
    if (!userPendingDelete) {
      return
    }
    const deletedName = userPendingDelete.fullName
    deleteUser.mutate(userPendingDelete.id, {
      onSuccess: () => {
        setUserPendingDelete(null)
        notify(t('admin.deletedToast', { name: deletedName }))
      },
      onError: () => notify(t('admin.actionError')),
    })
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <TopBar />
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
        <BackLink to={ROUTES.DASHBOARD}>{t('common.backToDashboard')}</BackLink>
        <div className="border-b border-line pb-6">
          <h1 className="font-serif text-3xl font-light tracking-tight text-ink">{t('admin.pageTitle')}</h1>
          <p className="mt-1 text-sm text-muted">{t('admin.pageSubtitle')}</p>
        </div>
        <AdminUserTable currentUserId={currentUserId} onNotify={notify} onRequestDelete={setUserPendingDelete} />
        <DeleteUserDialog
          user={userPendingDelete}
          isDeleting={deleteUser.isPending}
          onConfirm={handleConfirmDelete}
          onCancel={() => setUserPendingDelete(null)}
        />
        <Toast message={toastMessage} />
      </div>
    </div>
  )
}
