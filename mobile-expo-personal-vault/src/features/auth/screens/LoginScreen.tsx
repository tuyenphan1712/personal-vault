import { useRouter } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Logo } from '@/src/shared/components/Logo'
import { colors, fonts, spacing } from '@/src/shared/theme/tokens'
import { LoginForm, type LoginFormValues } from '../components/LoginForm'
import { useLogin } from '../hooks/useLogin'
import { extractAuthErrorMessage } from '../utils/extractAuthErrorMessage'

export function LoginScreen() {
  const router = useRouter()
  const { mutate, isPending, error } = useLogin()

  function handleSubmit(values: LoginFormValues) {
    mutate(values, {
      onSuccess: () => router.replace('/(protected)'),
    })
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mark}>
        <Logo showWordmark={false} height={48} />
      </View>
      <View style={styles.heading}>
        <Text style={styles.title}>Log in</Text>
        <Text style={styles.subtitle}>Access your personal vault</Text>
      </View>
      <LoginForm
        onSubmit={handleSubmit}
        isSubmitting={isPending}
        errorMessage={error ? extractAuthErrorMessage(error) : null}
      />
      <View style={styles.footer}>
        <Text style={styles.footerText}>No account yet? </Text>
        <Text
          accessibilityRole="link"
          style={styles.footerLink}
          onPress={() => router.push('/(public)/register')}
        >
          Register
        </Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
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
})
