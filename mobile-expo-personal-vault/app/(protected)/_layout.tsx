import { useAuthStore } from '@/src/features/auth'
import { Redirect, Stack } from 'expo-router'
import { colors } from '@/src/shared/theme/tokens'

export default function ProtectedLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isSessionLoading = useAuthStore((state) => state.isSessionLoading)

  if (isSessionLoading) {
    return null
  }

  if (!isAuthenticated) {
    return <Redirect href="/(public)/login" />
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="credentials" />
    </Stack>
  )
}
