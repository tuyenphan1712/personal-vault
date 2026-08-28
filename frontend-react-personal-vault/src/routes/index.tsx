import { BrowserRouter, Route, Routes } from 'react-router'
import App from '../app/App'
import { DashboardPage } from '../app/pages/DashboardPage'
import { LoginPage, RegisterPage } from '../features/auth'
import { CredentialDetailPage, CredentialListPage } from '../features/credentials'
import { ProfilePage } from '../features/profile'
import { AdminRoute } from './AdminRoute'
import { ProtectedRoute } from './ProtectedRoute'
import { ROUTES } from './routes'

// Feature pages are added under features/[feature]/pages and wired here as they are built.
// Example once available:
//   <Route element={<AdminRoute />}>
//     <Route path={ROUTES.ADMIN_USERS} element={<AdminUsersPage />} />
//   </Route>

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTES.CREDENTIALS} element={<CredentialListPage />} />
          <Route path={ROUTES.CREDENTIAL_DETAIL(':id')} element={<CredentialDetailPage />} />
          <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export { ROUTES, ProtectedRoute, AdminRoute }
