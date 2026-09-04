import { LanguageSwitcher } from './LanguageSwitcher'
import { Logo } from './Logo'
import { LogoutButton } from './LogoutButton'
import { ThemeToggleButton } from './ThemeToggleButton'

export function TopBar() {
  return (
    <header className="flex h-[60px] flex-none items-center gap-4 border-b border-line bg-surface px-7">
      <Logo />
      <div className="flex-1" />
      <LanguageSwitcher />
      <ThemeToggleButton />
      <LogoutButton />
    </header>
  )
}
