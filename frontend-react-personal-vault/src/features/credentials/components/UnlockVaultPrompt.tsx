import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation, type TFunction } from 'react-i18next'
import { z } from 'zod'
import { Button } from '@/shared/components/Button'
import { PasswordInput } from '@/shared/components/PasswordInput'
import { useUnlockVault } from '../hooks/useUnlockVault'

function createUnlockSchema(t: TFunction) {
  return z.object({
    password: z.string().min(1, t('credentials.unlock.passwordRequired')),
  })
}

type UnlockFormValues = z.infer<ReturnType<typeof createUnlockSchema>>

interface UnlockVaultPromptProps {
  onUnlocked: () => void
}

export function UnlockVaultPrompt({ onUnlocked }: UnlockVaultPromptProps) {
  const { t } = useTranslation()
  const unlockSchema = useMemo(() => createUnlockSchema(t), [t])
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
      <div className="flex w-full flex-col items-center gap-4 rounded-xl border border-line bg-surface p-8 text-center shadow-sm">
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[#B08442]/35 bg-[#EFE3CE]">
          <span className="block h-3.5 w-3.5 rounded-full bg-[#B08442]" />
        </span>
        <div>
          <h2 className="font-serif text-3xl font-light tracking-tight text-ink">{t('credentials.unlock.title')}</h2>
          <p className="mt-1 text-sm text-muted">{t('credentials.unlock.subtitle')}</p>
        </div>
        <form onSubmit={onSubmit} className="flex w-full flex-col gap-4 text-left">
          <PasswordInput label={t('credentials.fields.password')} {...register('password')} error={errors.password?.message} />
          <Button type="submit" isLoading={isUnlocking}>
            {t('credentials.unlock.button')}
          </Button>
        </form>
        <div className="w-full border-t border-line pt-4 font-mono text-xs uppercase tracking-wide text-muted">
          {t('credentials.unlock.footer')}
        </div>
      </div>
      <p className="text-center text-xs text-muted">{t('credentials.unlock.forgotten')}</p>
    </div>
  )
}
