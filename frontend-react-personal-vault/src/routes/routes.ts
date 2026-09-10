export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  CREDENTIALS: '/credentials',
  CREDENTIAL_DETAIL: (id: string) => `/credentials/${id}`,
  DOCUMENTS: '/documents',
  DOCUMENT_DETAIL: (id: string) => `/documents/${id}`,
  PROFILE: '/profile',
  AUDIT_LOG: '/audit-log',
  ADMIN_OVERVIEW: '/admin',
  ADMIN_USERS: '/admin/users',
} as const
