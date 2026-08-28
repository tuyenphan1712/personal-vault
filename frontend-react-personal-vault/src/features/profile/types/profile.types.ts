export interface Profile {
  id: string
  phone: string
  fullName: string
  role: 'admin' | 'member'
  status: 'active' | 'locked'
  birthday: string | null
}

export interface UpdateProfileRequest {
  fullName?: string
  birthday?: string | null
}
