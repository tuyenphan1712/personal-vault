import { useRouter } from 'expo-router'
import { StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
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
      <Text style={styles.title}>Create account</Text>
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
    padding: 24,
    justifyContent: 'center',
    gap: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
})
