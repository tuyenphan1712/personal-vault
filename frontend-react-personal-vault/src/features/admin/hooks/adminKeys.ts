import type { AdminUserListParams } from '../types/admin.types'

export const adminKeys = {
  all: ['admin-users'] as const,
  list: (params?: AdminUserListParams) => [...adminKeys.all, 'list', params] as const,
}
