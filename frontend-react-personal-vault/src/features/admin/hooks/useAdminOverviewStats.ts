import { useQuery } from '@tanstack/react-query'
import { adminService } from '../services/admin.service'
import type { AdminOverviewStats, AdminUser } from '../types/admin.types'
import { adminKeys } from './adminKeys'

const RECENT_SIGNUPS_COUNT = 5

function computeStats(users: AdminUser[]): AdminOverviewStats {
  const recentSignups = [...users]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, RECENT_SIGNUPS_COUNT)

  return {
    total: users.length,
    active: users.filter((user) => user.status === 'active').length,
    locked: users.filter((user) => user.status === 'locked').length,
    admins: users.filter((user) => user.role === 'admin').length,
    recentSignups,
  }
}

export function useAdminOverviewStats() {
  return useQuery({
    queryKey: adminKeys.overview(),
    queryFn: adminService.getAllForOverview,
    select: computeStats,
  })
}
