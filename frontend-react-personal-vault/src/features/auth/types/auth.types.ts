import type { CurrentUser } from './Session.types'

export interface RegisterRequest {
  phone: string
  password: string
  fullName: string
}

export interface LoginRequest {
  phone: string
  password: string
}

export interface AuthUser {
  id: string
  phone: string
  fullName: string
  role: 'admin' | 'member'
  status: 'active' | 'locked'
}

export interface LoginResponseData {
  user: CurrentUser
  accessToken: string
  refreshToken: string | null
  expiresIn: number
}

export interface RefreshResponseData {
  accessToken: string
  refreshToken: string | null
  expiresIn: number
}
