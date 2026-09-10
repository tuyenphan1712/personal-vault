import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { z } from 'zod'
import { Button } from '@/shared/components/Button'
import { PasswordInput } from '@/shared/components/PasswordInput'
import { IncorrectCurrentPasswordError, useChangePassword } from '../hooks/useChangePassword'

function createChangePasswordSchema(t: TFunction) {
  return z
    .object({
      currentPassword: z.string().min(1, t('auth.errors.passwordRequired')),
      newPassword: z.string().min(8, t('auth.errors.passwordMinLength')),
      confirmNewPassword: z.string(),
    })
    .refine((values) => values.newPassword === values.confirmNewPassword, {
      message: t('auth.errors.passwordsDoNotMatch'),
      path: ['confirmNewPassword'],
    })
}

type ChangePasswordFormValues = z.infer<ReturnType<typeof createChangePasswordSchema>>

function errorCode(error: unknown): string | undefined {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as { error?: { code?: string } } | undefined)?.error?.code
  }
  return undefined
}

interface ChangePasswordFormProps {
  onSuccess: () => void
}

export function ChangePasswordForm({ onSuccess }: ChangePasswordFormProps) {
  const { t } = useTranslation()
  const schema = useMemo(() => createChangePasswordSchema(t), [t])
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({ resolver: zodResolver(schema) })
  const changePassword = useChangePassword()

  const onSubmit = handleSubmit((values) => {
    changePassword.mutate(
      { currentPassword: values.currentPassword, newPassword: values.newPassword },
      { onSuccess },
    )
  })

  const isIncorrectCurrentPassword =
    changePassword.error instanceof IncorrectCurrentPasswordError || errorCode(changePassword.error) === 'AUTH_006'
  const isStaleCredentialSet = errorCode(changePassword.error) === 'CREDENTIAL_002'
  const isGenericError = changePassword.isError && !isIncorrectCurrentPassword && !isStaleCredentialSet

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <PasswordInput
        label={t('auth.fields.currentPassword')}
        {...register('currentPassword')}
        error={errors.currentPassword?.message ?? (isIncorrectCurrentPassword ? t('auth.errors.currentPasswordIncorrect') : undefined)}
      />
      <PasswordInput label={t('auth.fields.newPassword')} {...register('newPassword')} error={errors.newPassword?.message} />
      <PasswordInput
        label={t('auth.fields.confirmNewPassword')}
        {...register('confirmNewPassword')}
        error={errors.confirmNewPassword?.message}
      />
      {isStaleCredentialSet ? <p className="text-sm text-danger">{t('auth.errors.staleCredentialSet')}</p> : null}
      {isGenericError ? <p className="text-sm text-danger">{t('auth.changePasswordError')}</p> : null}
      <Button type="submit" isLoading={changePassword.isPending}>
        {t('auth.changePasswordButton')}
      </Button>
    </form>
  )
}
