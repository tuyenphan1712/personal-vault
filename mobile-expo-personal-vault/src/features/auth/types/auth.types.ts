import type { CurrentUser } from './Session.types'

export interface LoginRequest {
  phone: string
  password: string
  clientType: 'mobile'
}

export interface RegisterRequest {
  phone: string
  password: string
  fullName: string
}

export interface LoginResponse {
  user: CurrentUser
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface RefreshResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
}
