import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { Button } from '@/src/shared/components/Button'
import { TextField } from '@/src/shared/components/TextField'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import { IncorrectCurrentPasswordError, useChangePassword } from '../hooks/useChangePassword'

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmNewPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  })

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>

interface ChangePasswordFormProps {
  onSuccess: () => void
}

function errorCode(error: unknown): string | undefined {
  if (isAxiosError(error)) {
    return (error.response?.data as { error?: { code?: string } } | undefined)?.error?.code
  }
  return undefined
}

export function ChangePasswordForm({ onSuccess }: ChangePasswordFormProps) {
  const { colors, fonts } = useTheme()
  const { t } = useTranslation('auth')
  const changePassword = useChangePassword()

  const resolver = useMemo(
    () =>
      zodResolver(
        z
          .object({
            currentPassword: z.string().min(1, t('validation.currentPasswordRequired')),
            newPassword: z.string().min(8, t('validation.passwordMinLength')),
            confirmNewPassword: z.string(),
          })
          .refine((values) => values.newPassword === values.confirmNewPassword, {
            message: t('validation.passwordsDoNotMatch'),
            path: ['confirmNewPassword'],
          }),
      ),
    [t],
  )

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({ resolver })

  const isIncorrectCurrentPassword =
    changePassword.error instanceof IncorrectCurrentPasswordError || errorCode(changePassword.error) === 'AUTH_006'
  const isStaleCredentialSet = errorCode(changePassword.error) === 'CREDENTIAL_002'
  const isGenericError = changePassword.isError && !isIncorrectCurrentPassword && !isStaleCredentialSet

  const styles = useMemo(
    () =>
      StyleSheet.create({
    container: {
      gap: 14,
    },
    errorText: {
      fontFamily: fonts.sans,
      color: colors.danger,
      fontSize: 13,
    },
    button: {
      marginTop: 4,
    },
  }),
  [colors, fonts],
  )

  function onSubmit(values: ChangePasswordFormValues) {
    changePassword.mutate(
      { currentPassword: values.currentPassword, newPassword: values.newPassword },
      { onSuccess },
    )
  }

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="currentPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label={t('changePassword.currentPasswordLabel')}
            secureTextEntry
            autoCapitalize="none"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.currentPassword?.message ?? (isIncorrectCurrentPassword ? t('changePassword.currentPasswordIncorrect') : undefined)}
          />
        )}
      />

      <Controller
        control={control}
        name="newPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label={t('changePassword.newPasswordLabel')}
            secureTextEntry
            autoCapitalize="none"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.newPassword?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="confirmNewPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label={t('changePassword.confirmNewPasswordLabel')}
            secureTextEntry
            autoCapitalize="none"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.confirmNewPassword?.message}
          />
        )}
      />

      {isStaleCredentialSet ? <Text style={styles.errorText}>{t('changePassword.staleCredentialSet')}</Text> : null}
      {isGenericError ? <Text style={styles.errorText}>{t('changePassword.saveError')}</Text> : null}

      <Button
        label={t('changePassword.submit')}
        onPress={handleSubmit(onSubmit)}
        isLoading={changePassword.isPending}
        style={styles.button}
      />
    </View>
  )
}
