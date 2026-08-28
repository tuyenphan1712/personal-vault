import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/shared/components/Button'
import { PasswordInput } from '@/shared/components/PasswordInput'
import { useUnlockVault } from '../hooks/useUnlockVault'

const unlockSchema = z.object({
  password: z.string().min(1, 'Password is required'),
})

type UnlockFormValues = z.infer<typeof unlockSchema>

interface UnlockVaultPromptProps {
  onUnlocked: () => void
}

export function UnlockVaultPrompt({ onUnlocked }: UnlockVaultPromptProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UnlockFormValues>({ resolver: zodResolver(unlockSchema) })
  const { unlock, isUnlocking } = useUnlockVault()

  const onSubmit = handleSubmit(async (values) => {
    await unlock(values.password)
    onUnlocked()
  })

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
      <div className="mb-1 flex flex-col items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-primary-dark">
          <LockIcon />
        </span>
        <span className="text-base font-semibold tracking-tight text-ink">Personal Vault</span>
      </div>
      <div className="flex w-full flex-col items-center gap-4 rounded-xl border border-line bg-surface p-8 text-center shadow-sm">
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[#B08442]/35 bg-[#EFE3CE]">
          <span className="block h-3.5 w-3.5 rounded-full bg-[#B08442]" />
        </span>
        <div>
          <h2 className="font-serif text-3xl font-light tracking-tight text-ink">Your vault is sealed</h2>
          <p className="mt-1 text-sm text-muted">
            Enter your encryption password to open it. The key is derived here, on this device — nothing is
            sent.
          </p>
        </div>
        <form onSubmit={onSubmit} className="flex w-full flex-col gap-4 text-left">
          <PasswordInput label="Password" {...register('password')} error={errors.password?.message} />
          <Button type="submit" isLoading={isUnlocking}>
            Unlock vault
          </Button>
        </form>
        <div className="w-full border-t border-line pt-4 font-mono text-xs uppercase tracking-wide text-muted">
          AES-GCM · client-side encryption
        </div>
      </div>
      <p className="text-center text-xs text-muted">Forgotten it? There's no reset — only you hold the key.</p>
    </div>
  )
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}
