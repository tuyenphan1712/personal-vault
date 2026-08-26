import { Navigate, Outlet } from 'react-router'
import { useAuthStore } from '../features/auth'
import { ROUTES } from './routes'

export function AdminRoute() {
  const user = useAuthStore((state) => state.user)
  const isSessionLoading = useAuthStore((state) => state.isSessionLoading)

  if (isSessionLoading) {
    return null
  }

  if (user?.role !== 'admin') {
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  return <Outlet />
}
