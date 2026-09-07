import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { Button } from '@/src/shared/components/Button'
import { Logo } from '@/src/shared/components/Logo'
import { TextField } from '@/src/shared/components/TextField'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import { useUnlockVault } from '../hooks/useUnlockVault'

const unlockSchema = z.object({
  password: z.string().min(1, 'Password is required'),
})

type UnlockFormValues = z.infer<typeof unlockSchema>

interface UnlockVaultPromptProps {
  onUnlocked: () => void
}

export function UnlockVaultPrompt({ onUnlocked }: UnlockVaultPromptProps) {
  const { colors, fonts, radii } = useTheme()
  const { t } = useTranslation('credentials')

  const resolver = useMemo(
    () =>
      zodResolver(
        z.object({
          password: z.string().min(1, t('validation.passwordRequired')),
        }),
      ),
    [t],
  )

  const { control, handleSubmit, formState: { errors } } = useForm<UnlockFormValues>({
    resolver,
    defaultValues: { password: '' },
  })
  const { unlock, isUnlocking } = useUnlockVault()

  const onSubmit = handleSubmit(async (values) => {
    await unlock(values.password)
    onUnlocked()
  })

  const styles = useMemo(
    () =>
      StyleSheet.create({
    container: {
      padding: 24,
      alignItems: 'center',
    },
    card: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radii.lg,
      padding: 24,
      gap: 12,
      alignItems: 'center',
    },
    title: {
      fontFamily: fonts.serifLight,
      fontSize: 24,
      color: colors.ink,
    },
    subtitle: {
      fontFamily: fonts.sans,
      fontSize: 13.5,
      color: colors.muted,
      textAlign: 'center',
      marginBottom: 4,
    },
    button: {
      width: '100%',
      marginTop: 4,
    },
    statusText: {
      fontFamily: fonts.sans,
      color: colors.muted,
      fontSize: 12.5,
      textAlign: 'center',
    },
  }),
  [colors, fonts, radii],
  )

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Logo showWordmark={false} height={44} />
        <Text style={styles.title}>{t('unlock.title')}</Text>
        <Text style={styles.subtitle}>{t('unlock.subtitle')}</Text>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label={t('unlock.passwordLabel')}
              placeholder={t('unlock.passwordPlaceholder')}
              secureTextEntry
              autoCapitalize="none"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.password?.message}
            />
          )}
        />
        <Button label={t('unlock.submit')} onPress={onSubmit} isLoading={isUnlocking} style={styles.button} />
        {isUnlocking ? <Text style={styles.statusText}>{t('unlock.deriving')}</Text> : null}
      </View>
    </View>
  )
}
