import { Navigate, Outlet } from 'react-router'
import { useAuthStore } from '../features/auth'
import { ROUTES } from './routes'

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isSessionLoading = useAuthStore((state) => state.isSessionLoading)

  if (isSessionLoading) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  return <Outlet />
}
