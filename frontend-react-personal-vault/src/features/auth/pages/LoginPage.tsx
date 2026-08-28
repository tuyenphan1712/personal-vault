import { Link, useNavigate } from 'react-router'
import { ROUTES } from '@/routes/routes'
import { LoginForm } from '../components/LoginForm'

export function LoginPage() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-10">
      <div className="flex flex-col gap-6 rounded-lg border border-line bg-surface p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-ink">Log in</h1>
        <LoginForm onSuccess={() => navigate(ROUTES.DASHBOARD)} />
        <p className="text-sm text-muted">
          Don't have an account?{' '}
          <Link to={ROUTES.REGISTER} className="font-medium text-ink underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}
