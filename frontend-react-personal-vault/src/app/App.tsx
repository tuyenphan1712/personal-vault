import { Navigate } from 'react-router'
import { useAuthStore } from '@/features/auth'
import { ROUTES } from '@/routes/routes'

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isSessionLoading = useAuthStore((state) => state.isSessionLoading)
  const role = useAuthStore((state) => state.user?.role)

  if (isSessionLoading) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  return <Navigate to={role === 'admin' ? ROUTES.ADMIN_OVERVIEW : ROUTES.DASHBOARD} replace />
}

export default App
