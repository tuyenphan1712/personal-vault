import type { ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'

interface BackLinkProps {
  to: LinkProps['to']
  children: ReactNode
}

export function BackLink({ to, children }: BackLinkProps) {
  return (
    <Link
      to={to}
      className="-ml-2 inline-flex items-center gap-1.5 rounded-md py-1 pl-2 pr-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-hover hover:text-ink"
    >
      <ArrowLeftIcon />
      {children}
    </Link>
  )
}

function ArrowLeftIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  )
}
