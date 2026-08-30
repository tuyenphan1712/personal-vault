import { VaultMark } from './VaultMark'

export function VaultBadge() {
  return (
    <div className="mb-1 flex flex-col items-center gap-2">
      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface">
        <VaultMark size={26} />
      </span>
      <span className="font-serif text-base font-medium tracking-tight text-ink">Personal Vault</span>
    </div>
  )
}
