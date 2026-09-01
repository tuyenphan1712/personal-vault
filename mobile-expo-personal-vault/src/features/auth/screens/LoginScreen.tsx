import { useRouter } from 'expo-router'
import { StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LoginForm, type LoginFormValues } from '../components/LoginForm'
import { useLogin } from '../hooks/useLogin'
import { extractAuthErrorMessage } from '../utils/extractAuthErrorMessage'

export function LoginScreen() {
  const router = useRouter()
  const { mutate, isPending, error } = useLogin()

  function handleSubmit(values: LoginFormValues) {
    mutate(values, {
      onSuccess: () => router.replace('/(protected)/(tabs)'),
    })
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Log in</Text>
      <LoginForm
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
    padding: 24,
    justifyContent: 'center',
    gap: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
})
