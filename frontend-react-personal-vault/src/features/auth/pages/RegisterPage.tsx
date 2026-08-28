import { Link, useNavigate } from 'react-router'
import { ROUTES } from '@/routes/routes'
import { RegisterForm } from '../components/RegisterForm'

export function RegisterPage() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-10">
      <div className="flex flex-col gap-6 rounded-lg border border-line bg-surface p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-ink">Create account</h1>
        <RegisterForm onSuccess={() => navigate(ROUTES.LOGIN)} />
        <p className="text-sm text-muted">
          Already have an account?{' '}
          <Link to={ROUTES.LOGIN} className="font-medium text-ink underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
