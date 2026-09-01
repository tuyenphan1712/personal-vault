export interface AdminUser {
  id: string
  phone: string
  fullName: string
  role: 'admin' | 'member'
  status: 'active' | 'locked'
  createdAt: string
}

export interface AdminUserListParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
}

export interface UpdateUserStatusRequest {
  status: 'active' | 'locked'
}
