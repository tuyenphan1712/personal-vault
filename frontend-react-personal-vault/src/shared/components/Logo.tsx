export function Logo() {
  return (
    <svg viewBox="0 0 260 48" width="176" height="32" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="19" stroke="var(--color-ink)" strokeWidth="1.6" />
      <circle cx="24" cy="24" r="13.5" stroke="#b08442" strokeWidth="1.1" strokeDasharray="1.4 3.2" strokeLinecap="round" />
      <path d="M16.5 20.5 L24 28.5 L31.5 20.5" stroke="var(--color-ink)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 28.5 V34" stroke="#b08442" strokeWidth="2.4" strokeLinecap="round" />
      <text x="56" y="26" fontFamily="Newsreader, Georgia, serif" fontSize="23" fontWeight="400" fill="var(--color-ink)" letterSpacing="-0.2">
        Personal Vault
      </text>
      <text x="56.5" y="39" fontFamily="IBM Plex Sans, Helvetica, sans-serif" fontSize="8.5" fontWeight="500" letterSpacing="2.2" fill="var(--color-muted)">
        SEALED BEFORE IT LEAVES
      </text>
    </svg>
  )
}
