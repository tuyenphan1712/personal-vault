import { useAuthStore } from '@/src/features/auth'
import { Redirect, Stack } from 'expo-router'

export default function PublicLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isSessionLoading = useAuthStore((state) => state.isSessionLoading)

  if (isSessionLoading) {
    return null
  }

  if (isAuthenticated) {
    return <Redirect href="/(protected)/(tabs)" />
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  )
}
