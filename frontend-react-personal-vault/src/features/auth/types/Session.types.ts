export interface CurrentUser {
  id: string
  phone: string
  fullName: string
  role: 'admin' | 'member'
}
