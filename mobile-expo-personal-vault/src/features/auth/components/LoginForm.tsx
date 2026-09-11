import { zodResolver } from '@hookform/resolvers/zod'
import { Ionicons } from '@expo/vector-icons'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { Button } from '@/src/shared/components/Button'
import { TextField } from '@/src/shared/components/TextField'
import { useBiometricStore } from '@/src/features/settings/stores/biometric.store'
import { getBiometricAvailability, type BiometricAvailability } from '@/src/shared/lib/auth/biometricAdapter'
import { readBiometricCredential } from '@/src/shared/lib/auth/biometricCredentialStore'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import { useLastAccountStore } from '../stores/lastAccount.store'

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
  const { colors, fonts, radii } = useTheme()
  const { t } = useTranslation('auth')

  const rememberedPhone = useLastAccountStore((state) => state.phone)
  const hasHydratedLastAccount = useLastAccountStore((state) => state.hasHydrated)
  const biometricEnabled = useBiometricStore((state) => state.enabled)

  const [showSwitchAccount, setShowSwitchAccount] = useState(false)
  const [biometricAvailability, setBiometricAvailability] = useState<BiometricAvailability | 'checking'>('checking')
  const [biometricError, setBiometricError] = useState<string | null>(null)

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

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<LoginFormValues>({
    resolver,
    defaultValues: { phone: '', password: '' },
  })

  useEffect(() => {
    if (hasHydratedLastAccount && !isDirty) {
      reset({ phone: rememberedPhone ?? '', password: '' })
      setShowSwitchAccount(rememberedPhone !== null)
    }
    // Only re-sync from the remembered phone before the user has touched the form; `isDirty` is
    // intentionally excluded so typing doesn't retrigger this once hydration has already applied.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydratedLastAccount, rememberedPhone, reset])

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
    switchAccountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 4,
    },
    switchAccountText: {
      fontFamily: fonts.sans,
      fontSize: 12.5,
      color: colors.muted,
    },
    submitRow: {
      flexDirection: 'row',
      gap: 10,
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
      backgroundColor: colors.surface,
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

  function handleSwitchAccount() {
    reset({ phone: '', password: '' })
    setShowSwitchAccount(false)
  }

  async function handleBiometricLogin() {
    setBiometricError(null)
    try {
      const credential = await readBiometricCredential()
      if (!credential) {
        return
      }
      onSubmit({ phone: credential.phone, password: credential.password })
    } catch {
      setBiometricError(t('login.biometricError'))
    }
  }

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

      {showSwitchAccount ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('login.switchAccount')}
          style={styles.switchAccountRow}
          onPress={handleSwitchAccount}
        >
          <Ionicons name="sync-outline" size={14} color={colors.muted} />
          <Text style={styles.switchAccountText}>{t('login.switchAccount')}</Text>
        </Pressable>
      ) : null}

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      {biometricError ? <Text style={styles.errorText}>{biometricError}</Text> : null}

      <View style={styles.submitRow}>
        <Button
          label={t('login.submit')}
          onPress={handleSubmit(onSubmit)}
          isLoading={isSubmitting}
          style={styles.submitButton}
        />
        {showBiometricButton ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('login.biometricButtonLabel')}
            style={styles.biometricButton}
            onPress={handleBiometricLogin}
          >
            <Ionicons name="finger-print" size={22} color={colors.ink} />
          </Pressable>
        ) : null}
      </View>
      {isSubmitting && statusLabel ? <Text style={styles.statusText}>{statusLabel}</Text> : null}
    </View>
  )
}
