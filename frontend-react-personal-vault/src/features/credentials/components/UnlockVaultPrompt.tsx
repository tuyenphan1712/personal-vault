import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
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
    <div className="mx-auto flex max-w-sm flex-col gap-4 rounded-lg border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900">Unlock your vault</h2>
      <p className="text-sm text-slate-600">
        Enter your password again to decrypt your saved credentials on this device.
      </p>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input
          label="Password"
          type="password"
          {...register('password')}
          error={errors.password?.message}
        />
        <Button type="submit" isLoading={isUnlocking}>
          Unlock
        </Button>
      </form>
    </div>
  )
}
