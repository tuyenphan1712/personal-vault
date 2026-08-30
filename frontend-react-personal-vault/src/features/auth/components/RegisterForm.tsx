import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation, type TFunction } from 'react-i18next'
import { z } from 'zod'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { PasswordInput } from '@/shared/components/PasswordInput'
import { useRegister } from '../hooks/useRegister'

// Kept in sync with backend RegisterRequest (Jakarta Bean Validation) per API_SPEC.md §7.
function createRegisterSchema(t: TFunction) {
  return z.object({
    phone: z.string().regex(/^[0-9]{9,15}$/, t('auth.errors.phoneInvalid')),
    password: z.string().min(8, t('auth.errors.passwordMinLength')).max(255),
    fullName: z.string().min(1, t('auth.errors.fullNameRequired')).max(255),
  })
}

type RegisterFormValues = z.infer<ReturnType<typeof createRegisterSchema>>

interface RegisterFormProps {
  onSuccess: () => void
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { t } = useTranslation()
  const registerSchema = useMemo(() => createRegisterSchema(t), [t])
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) })
  const registerUser = useRegister()

  const onSubmit = handleSubmit((values) => {
    registerUser.mutate(values, { onSuccess })
  })

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-4 text-left">
      <Input label={t('auth.fields.fullName')} {...register('fullName')} error={errors.fullName?.message} />
      <Input label={t('auth.fields.phone')} type="tel" {...register('phone')} error={errors.phone?.message} />
      <PasswordInput label={t('auth.fields.password')} {...register('password')} error={errors.password?.message} />
      {registerUser.isError ? <p className="text-sm text-danger">{t('auth.registerError')}</p> : null}
      <Button type="submit" isLoading={registerUser.isPending}>
        {t('auth.registerButton')}
      </Button>
    </form>
  )
}
