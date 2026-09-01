import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/Button'
import { toIntlLocale } from '@/shared/i18n'
import { useUpdateUserStatus } from '../hooks/useUpdateUserStatus'
import type { AdminUser } from '../types/admin.types'

interface AdminUserRowProps {
  user: AdminUser
  isSelf: boolean
  onNotify: (message: string) => void
  onRequestDelete: (user: AdminUser) => void
}

export function AdminUserRow({ user, isSelf, onNotify, onRequestDelete }: AdminUserRowProps) {
  const { t, i18n } = useTranslation()
  const updateStatus = useUpdateUserStatus()

  const isLocked = user.status === 'locked'

  const handleToggleStatus = () => {
    const nextStatus = isLocked ? 'active' : 'locked'
    updateStatus.mutate(
      { id: user.id, payload: { status: nextStatus } },
      {
        onSuccess: () =>
          onNotify(nextStatus === 'locked' ? t('admin.lockedToast', { name: user.fullName }) : t('admin.unlockedToast', { name: user.fullName })),
        onError: () => onNotify(t('admin.actionError')),
      },
    )
  }

  return (
    <tr className="border-b border-line last:border-0">
      <td className="py-3 pr-4 font-mono text-sm text-ink">{user.phone}</td>
      <td className="py-3 pr-4 text-sm text-ink">{user.fullName}</td>
      <td className="py-3 pr-4">
        <span className="inline-flex items-center rounded-full bg-mist-soft px-2.5 py-1 text-xs font-medium text-mist">
          {user.role === 'admin' ? t('admin.roleAdmin') : t('admin.roleMember')}
        </span>
      </td>
      <td className="py-3 pr-4">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
            isLocked ? 'bg-danger-soft text-danger' : 'bg-primary-soft text-primary-dark'
          }`}
        >
          {isLocked ? t('admin.statusLocked') : t('admin.statusActive')}
        </span>
      </td>
      <td className="py-3 pr-4 font-mono text-xs text-muted">
        {new Date(user.createdAt).toLocaleDateString(toIntlLocale(i18n.language))}
      </td>
      <td className="py-3 pl-0">
        <div className="flex justify-end gap-1.5">
          <Button
            variant="secondary"
            isLoading={updateStatus.isPending}
            disabled={isSelf}
            title={isSelf ? t('admin.cannotActOnSelf') : undefined}
            onClick={handleToggleStatus}
          >
            {isLocked ? t('admin.unlockButton') : t('admin.lockButton')}
          </Button>
          <Button variant="danger" disabled={isSelf} title={isSelf ? t('admin.cannotActOnSelf') : undefined} onClick={() => onRequestDelete(user)}>
            {t('common.delete')}
          </Button>
        </div>
      </td>
    </tr>
  )
}
