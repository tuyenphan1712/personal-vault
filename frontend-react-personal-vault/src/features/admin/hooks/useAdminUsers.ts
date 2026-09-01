import { useQuery } from '@tanstack/react-query'
import { adminService } from '../services/admin.service'
import type { AdminUserListParams } from '../types/admin.types'
import { adminKeys } from './adminKeys'

export function useAdminUsers(params?: AdminUserListParams) {
  return useQuery({
    queryKey: adminKeys.list(params),
    queryFn: () => adminService.getAll(params),
  })
}
