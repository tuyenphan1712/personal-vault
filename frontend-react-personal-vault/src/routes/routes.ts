export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  CREDENTIALS: '/credentials',
  CREDENTIAL_DETAIL: (id: string) => `/credentials/${id}`,
  DOCUMENTS: '/documents',
  DOCUMENT_DETAIL: (id: string) => `/documents/${id}`,
  PROFILE: '/profile',
  ADMIN_USERS: '/admin/users',
} as const
