import { Link, useNavigate } from 'react-router'
import { ROUTES } from '@/routes/routes'
import { RegisterForm } from '../components/RegisterForm'

export function RegisterPage() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <h1 className="text-2xl font-semibold text-slate-900">Create account</h1>
      <RegisterForm onSuccess={() => navigate(ROUTES.LOGIN)} />
      <p className="text-sm text-slate-600">
        Already have an account?{' '}
        <Link to={ROUTES.LOGIN} className="font-medium text-slate-900 underline">
          Log in
        </Link>
      </p>
    </div>
  )
}
