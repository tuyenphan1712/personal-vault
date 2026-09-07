import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { Button } from '@/src/shared/components/Button'
import { TextField } from '@/src/shared/components/TextField'
import { useTheme } from '@/src/shared/theme/ThemeProvider'

const registerSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  phone: z.string().min(1, 'Phone number is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export type RegisterFormValues = z.infer<typeof registerSchema>

interface RegisterFormProps {
  onSubmit: (values: RegisterFormValues) => void
  isSubmitting: boolean
  errorMessage: string | null
}

export function RegisterForm({ onSubmit, isSubmitting, errorMessage }: RegisterFormProps) {
  const { colors, fonts } = useTheme()
  const { t } = useTranslation('auth')

  const resolver = useMemo(
    () =>
      zodResolver(
        z.object({
          fullName: z.string().min(1, t('validation.fullNameRequired')),
          phone: z.string().min(1, t('validation.phoneRequired')),
          password: z.string().min(8, t('validation.passwordMinLength')),
        }),
      ),
    [t],
  )

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver,
    defaultValues: { fullName: '', phone: '', password: '' },
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
  }),
  [colors, fonts],
  )

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="fullName"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label={t('register.fullNameLabel')}
            placeholder={t('register.fullNamePlaceholder')}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.fullName?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="phone"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label={t('register.phoneLabel')}
            placeholder={t('register.phonePlaceholder')}
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
            label={t('register.passwordLabel')}
            placeholder={t('register.passwordPlaceholder')}
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

      <Button label={t('register.submit')} onPress={handleSubmit(onSubmit)} isLoading={isSubmitting} style={styles.button} />
    </View>
  )
}
