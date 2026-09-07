import { useAuthStore } from '@/src/features/auth'
import { Redirect, Stack } from 'expo-router'
import { useTheme } from '@/src/shared/theme/ThemeProvider'

export default function ProtectedLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isSessionLoading = useAuthStore((state) => state.isSessionLoading)
  const { colors } = useTheme()

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
      <Stack.Screen name="documents" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="settings" />
    </Stack>
  )
}
