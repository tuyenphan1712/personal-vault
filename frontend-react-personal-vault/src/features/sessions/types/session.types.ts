export type ClientType = 'web' | 'mobile'

export interface Session {
  id: string
  clientType: ClientType
  deviceInfo: string | null
  createdAt: string
  expiresAt: string
  isCurrent: boolean
}
