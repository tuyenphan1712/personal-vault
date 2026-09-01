import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSessionBootstrap } from '@/src/features/auth';
import { AppProviders } from '@/src/providers/AppProviders';

export const unstable_settings = {
  anchor: '(protected)',
};

function RootNavigator() {
  const colorScheme = useColorScheme();
  useSessionBootstrap();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(protected)" />
        <Stack.Screen name="(public)" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}
