interface VaultMarkProps {
  size?: number
}

export function VaultMark({ size = 24 }: VaultMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="19" stroke="var(--color-ink)" strokeWidth="1.6" />
      <circle cx="24" cy="24" r="13.5" stroke="#b08442" strokeWidth="1.1" strokeDasharray="1.4 3.2" strokeLinecap="round" />
      <path d="M16.5 20.5 L24 28.5 L31.5 20.5" stroke="var(--color-ink)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 28.5 V34" stroke="#b08442" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}
