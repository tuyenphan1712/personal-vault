import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { Logo } from '@/src/shared/components/Logo'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import { LoginForm, type LoginFormValues } from '../components/LoginForm'
import { useLogin } from '../hooks/useLogin'
import { extractAuthErrorMessage } from '../utils/extractAuthErrorMessage'

export function LoginScreen() {
  const router = useRouter()
  const { mutate, isPending, error, stage } = useLogin()
  const { colors, fonts, spacing } = useTheme()
  const { t } = useTranslation('auth')

  const STAGE_LABELS: Record<string, string> = {
    signingIn: t('login.signingIn'),
    derivingKey: t('login.derivingKey'),
  }

  function handleSubmit(values: LoginFormValues) {
    // No explicit navigation on success: setting the session (inside useLogin's mutationFn)
    // flips useAuthStore.isAuthenticated, and app/(public)/_layout.tsx reactively redirects to
    // /(protected) as soon as that happens. Navigating here too raced that redirect and could
    // leave the router stuck mid-transition after this screen had already been unmounted.
    mutate(values)
  }

  const styles = useMemo(
    () =>
      StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
      padding: spacing.xxl,
      justifyContent: 'center',
      gap: spacing.xl,
    },
    mark: {
      alignSelf: 'center',
    },
    heading: {
      alignItems: 'center',
      gap: 4,
    },
    title: {
      fontFamily: fonts.serifLight,
      fontSize: 28,
      color: colors.ink,
    },
    subtitle: {
      fontFamily: fonts.sans,
      fontSize: 13,
      color: colors.muted,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
    },
    footerText: {
      fontFamily: fonts.sans,
      fontSize: 13,
      color: colors.muted,
    },
    footerLink: {
      fontFamily: fonts.sansSemiBold,
      fontSize: 13,
      color: colors.primaryDark,
    },
  }),
  [colors, fonts, spacing],
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mark}>
        <Logo showWordmark={false} height={48} />
      </View>
      <View style={styles.heading}>
        <Text style={styles.title}>{t('login.title')}</Text>
        <Text style={styles.subtitle}>{t('login.subtitle')}</Text>
      </View>
      <LoginForm
        onSubmit={handleSubmit}
        isSubmitting={isPending}
        errorMessage={error ? extractAuthErrorMessage(error) : null}
        statusLabel={STAGE_LABELS[stage]}
      />
      <View style={styles.footer}>
        <Text style={styles.footerText}>{t('login.noAccount')}</Text>
        <Text
          accessibilityRole="link"
          style={styles.footerLink}
          onPress={() => router.push('/(public)/register')}
        >
          {t('login.registerLink')}
        </Text>
      </View>
    </SafeAreaView>
  )
}
