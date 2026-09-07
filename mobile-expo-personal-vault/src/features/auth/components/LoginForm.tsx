import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { Button } from '@/src/shared/components/Button'
import { TextField } from '@/src/shared/components/TextField'
import { useTheme } from '@/src/shared/theme/ThemeProvider'

const loginSchema = z.object({
  phone: z.string().min(1, 'Phone number is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export type LoginFormValues = z.infer<typeof loginSchema>

interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => void
  isSubmitting: boolean
  errorMessage: string | null
  statusLabel?: string | null
}

export function LoginForm({ onSubmit, isSubmitting, errorMessage, statusLabel }: LoginFormProps) {
  const { colors, fonts } = useTheme()
  const { t } = useTranslation('auth')

  const resolver = useMemo(
    () =>
      zodResolver(
        z.object({
          phone: z.string().min(1, t('validation.phoneRequired')),
          password: z.string().min(8, t('validation.passwordMinLength')),
        }),
      ),
    [t],
  )

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver,
    defaultValues: { phone: '', password: '' },
  })

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
    statusText: {
      fontFamily: fonts.sans,
      color: colors.muted,
      fontSize: 12.5,
      textAlign: 'center',
    },
  }),
  [colors, fonts],
  )

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="phone"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label={t('login.phoneLabel')}
            placeholder={t('login.phonePlaceholder')}
            keyboardType="phone-pad"
            autoCapitalize="none"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.phone?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label={t('login.passwordLabel')}
            placeholder={t('login.passwordPlaceholder')}
            secureTextEntry
            autoCapitalize="none"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.password?.message}
          />
        )}
      />

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <Button label={t('login.submit')} onPress={handleSubmit(onSubmit)} isLoading={isSubmitting} style={styles.button} />
      {isSubmitting && statusLabel ? <Text style={styles.statusText}>{statusLabel}</Text> : null}
    </View>
  )
}
