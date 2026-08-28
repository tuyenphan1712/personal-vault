import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useAuthStore, useLogout } from '@/features/auth'
import { Button } from '@/shared/components/Button'
import { ROUTES } from '@/routes/routes'

interface NavTile {
  label: string
  description: string
  route: string
  icon: ReactNode
}

const NAV_TILES: NavTile[] = [
  {
    label: 'Credentials',
    description: 'Mật khẩu và tài khoản đã lưu, mã hoá trên thiết bị.',
    route: ROUTES.CREDENTIALS,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z" />
        <circle cx="16.5" cy="7.5" r="0.6" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: 'Documents',
    description: 'Giấy tờ và tài liệu riêng tư của bạn.',
    route: ROUTES.DOCUMENTS,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
        <path d="M10 9H8" />
        <path d="M16 13H8" />
        <path d="M16 17H8" />
      </svg>
    ),
  },
  {
    label: 'Profile',
    description: 'Thông tin tài khoản của bạn.',
    route: ROUTES.PROFILE,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="5" />
        <path d="M20 21a8 8 0 0 0-16 0" />
      </svg>
    ),
  },
]

function Logo() {
  return (
    <svg viewBox="0 0 260 48" width="176" height="32" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="19" stroke="#1e1c1a" strokeWidth="1.6" />
      <circle cx="24" cy="24" r="13.5" stroke="#b08442" strokeWidth="1.1" strokeDasharray="1.4 3.2" strokeLinecap="round" />
      <path d="M16.5 20.5 L24 28.5 L31.5 20.5" stroke="#1e1c1a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 28.5 V34" stroke="#b08442" strokeWidth="2.4" strokeLinecap="round" />
      <text x="56" y="26" fontFamily="Newsreader, Georgia, serif" fontSize="23" fontWeight="400" fill="#1e1c1a" letterSpacing="-0.2">
        Personal Vault
      </text>
      <text x="56.5" y="39" fontFamily="IBM Plex Sans, Helvetica, sans-serif" fontSize="8.5" fontWeight="500" letterSpacing="2.2" fill="#837c74">
        SEALED BEFORE IT LEAVES
      </text>
    </svg>
  )
}

export function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()
  const logout = useLogout()

  return (
    <div className="vault-scope flex min-h-screen flex-col bg-bg">
      <header className="flex h-[60px] flex-none items-center gap-4 border-b border-line bg-surface px-7">
        <Logo />
        <div className="flex-1" />
        <Button
          variant="secondary"
          isLoading={logout.isPending}
          onClick={() => logout.mutate(undefined, { onSuccess: () => navigate(ROUTES.LOGIN) })}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Đăng xuất
        </Button>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <h1 className="font-serif text-4xl font-light tracking-tight text-ink">Dashboard</h1>
        <p className="mt-2.5 mb-10 text-sm text-muted">Xin chào, {user?.fullName}</p>

        <div className="flex flex-wrap justify-center gap-6">
          {NAV_TILES.map((tile) => (
            <button
              key={tile.route}
              type="button"
              onClick={() => navigate(tile.route)}
              className="flex w-60 flex-col items-start gap-3.5 rounded-2xl border border-line bg-surface p-7 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary-soft hover:shadow-md"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-primary-soft text-primary-dark">
                {tile.icon}
              </span>
              <span className="text-[17px] font-medium text-ink">{tile.label}</span>
              <span className="text-[13.5px] leading-relaxed text-muted">{tile.description}</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
