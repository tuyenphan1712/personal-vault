import { BrowserRouter, Route, Routes } from 'react-router'
import App from '../app/App'
import { AdminRoute } from './AdminRoute'
import { ProtectedRoute } from './ProtectedRoute'
import { ROUTES } from './routes'

// Feature pages are added under features/[feature]/pages and wired here as they are built.
// Example once available:
//   <Route path={ROUTES.LOGIN} element={<LoginPage />} />
//   <Route element={<ProtectedRoute />}>
//     <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
//   </Route>
//   <Route element={<AdminRoute />}>
//     <Route path={ROUTES.ADMIN_USERS} element={<AdminUsersPage />} />
//   </Route>

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
      </Routes>
    </BrowserRouter>
  )
}

export { ROUTES, ProtectedRoute, AdminRoute }
