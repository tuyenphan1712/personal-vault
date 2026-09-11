import { zodResolver } from '@hookform/resolvers/zod'
import { Ionicons } from '@expo/vector-icons'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { Button } from '@/src/shared/components/Button'
import { Logo } from '@/src/shared/components/Logo'
import { TextField } from '@/src/shared/components/TextField'
import { useBiometricStore } from '@/src/features/settings/stores/biometric.store'
import { getBiometricAvailability, type BiometricAvailability } from '@/src/shared/lib/auth/biometricAdapter'
import { readBiometricCredential } from '@/src/shared/lib/auth/biometricCredentialStore'
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
  const biometricEnabled = useBiometricStore((state) => state.enabled)

  const [biometricAvailability, setBiometricAvailability] = useState<BiometricAvailability | 'checking'>('checking')
  const [biometricError, setBiometricError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getBiometricAvailability().then((result) => {
      if (!cancelled) {
        setBiometricAvailability(result)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const showBiometricButton = biometricEnabled && biometricAvailability === 'available'

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

  async function handleBiometricUnlock() {
    setBiometricError(null)
    try {
      const credential = await readBiometricCredential()
      if (!credential) {
        return
      }
      await unlock(credential.password)
      onUnlocked()
    } catch {
      setBiometricError(t('unlock.biometricError'))
    }
  }

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
    errorText: {
      fontFamily: fonts.sans,
      color: colors.danger,
      fontSize: 13,
      textAlign: 'center',
    },
    submitRow: {
      flexDirection: 'row',
      gap: 10,
      width: '100%',
      marginTop: 4,
    },
    submitButton: {
      flex: 3.5,
    },
    biometricButton: {
      flex: 1.5,
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.bg,
      alignItems: 'center',
      justifyContent: 'center',
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
        {biometricError ? <Text style={styles.errorText}>{biometricError}</Text> : null}
        <View style={styles.submitRow}>
          <Button label={t('unlock.submit')} onPress={onSubmit} isLoading={isUnlocking} style={styles.submitButton} />
          {showBiometricButton ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('unlock.biometricButtonLabel')}
              style={styles.biometricButton}
              onPress={handleBiometricUnlock}
            >
              <Ionicons name="finger-print" size={22} color={colors.ink} />
            </Pressable>
          ) : null}
        </View>
        {isUnlocking ? <Text style={styles.statusText}>{t('unlock.deriving')}</Text> : null}
      </View>
    </View>
  )
}
