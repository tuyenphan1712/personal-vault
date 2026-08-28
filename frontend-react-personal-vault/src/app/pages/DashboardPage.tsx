import { Link, useNavigate } from 'react-router'
import { useAuthStore, useLogout } from '@/features/auth'
import { Button } from '@/shared/components/Button'
import { ROUTES } from '@/routes/routes'

export function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()
  const logout = useLogout()

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Welcome, {user?.fullName}</h1>
        <Button
          variant="secondary"
          isLoading={logout.isPending}
          onClick={() => logout.mutate(undefined, { onSuccess: () => navigate(ROUTES.LOGIN) })}
        >
          Log out
        </Button>
      </div>
      <nav className="flex flex-col gap-2">
        <Link to={ROUTES.CREDENTIALS} className="text-slate-900 underline">
          Credentials
        </Link>
        <Link to={ROUTES.PROFILE} className="text-slate-900 underline">
          Profile
        </Link>
      </nav>
    </div>
  )
}
