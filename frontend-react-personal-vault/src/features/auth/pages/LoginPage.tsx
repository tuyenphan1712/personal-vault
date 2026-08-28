import { Link, useNavigate } from 'react-router'
import { ROUTES } from '@/routes/routes'
import { LoginForm } from '../components/LoginForm'

export function LoginPage() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <h1 className="text-2xl font-semibold text-slate-900">Log in</h1>
      <LoginForm onSuccess={() => navigate(ROUTES.DASHBOARD)} />
      <p className="text-sm text-slate-600">
        Don't have an account?{' '}
        <Link to={ROUTES.REGISTER} className="font-medium text-slate-900 underline">
          Register
        </Link>
      </p>
    </div>
  )
}
