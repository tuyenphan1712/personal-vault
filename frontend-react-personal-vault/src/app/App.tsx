import { Navigate } from 'react-router'
import { useAuthStore } from '@/features/auth'
import { ROUTES } from '@/routes/routes'

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isSessionLoading = useAuthStore((state) => state.isSessionLoading)

  if (isSessionLoading) {
    return null
  }

  return <Navigate to={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.LOGIN} replace />
}

export default App
