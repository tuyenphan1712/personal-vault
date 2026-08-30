import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation, type TFunction } from 'react-i18next'
import { z } from 'zod'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { PasswordInput } from '@/shared/components/PasswordInput'
import { useLogin } from '../hooks/useLogin'

function createLoginSchema(t: TFunction) {
  return z.object({
    phone: z.string().min(1, t('auth.errors.phoneRequired')),
    password: z.string().min(1, t('auth.errors.passwordRequired')),
  })
}

type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>

interface LoginFormProps {
  onSuccess: () => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { t } = useTranslation()
  const loginSchema = useMemo(() => createLoginSchema(t), [t])
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })
  const login = useLogin()

  const onSubmit = handleSubmit((values) => {
    login.mutate(values, { onSuccess })
  })

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-4 text-left">
      <Input label={t('auth.fields.phone')} type="tel" {...register('phone')} error={errors.phone?.message} />
      <PasswordInput label={t('auth.fields.password')} {...register('password')} error={errors.password?.message} />
      {login.isError ? <p className="text-sm text-danger">{t('auth.loginError')}</p> : null}
      <Button type="submit" isLoading={login.isPending}>
        {t('auth.loginButton')}
      </Button>
    </form>
  )
}
