import { useRouter } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Logo } from '@/src/shared/components/Logo'
import { colors, fonts, spacing } from '@/src/shared/theme/tokens'
import { RegisterForm, type RegisterFormValues } from '../components/RegisterForm'
import { useRegister } from '../hooks/useRegister'
import { extractAuthErrorMessage } from '../utils/extractAuthErrorMessage'

export function RegisterScreen() {
  const router = useRouter()
  const { mutate, isPending, error } = useRegister()

  function handleSubmit(values: RegisterFormValues) {
    mutate(values, {
      onSuccess: () => router.replace('/(public)/login'),
    })
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mark}>
        <Logo showWordmark={false} height={48} />
      </View>
      <View style={styles.heading}>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Start your personal vault</Text>
      </View>
      <RegisterForm
        onSubmit={handleSubmit}
        isSubmitting={isPending}
        errorMessage={error ? extractAuthErrorMessage(error) : null}
      />
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
    fontSize: 26,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.muted,
  },
})
