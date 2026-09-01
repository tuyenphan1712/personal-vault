import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { IBMPlexMono_400Regular, IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono';
import { IBMPlexSans_400Regular, IBMPlexSans_500Medium, IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans';
import { Newsreader_300Light, Newsreader_500Medium, Newsreader_600SemiBold } from '@expo-google-fonts/newsreader';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSessionBootstrap } from '@/src/features/auth';
import { AppProviders } from '@/src/providers/AppProviders';

SplashScreen.preventAutoHideAsync();

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
  const [fontsLoaded] = useFonts({
    Newsreader_300Light,
    Newsreader_500Medium,
    Newsreader_600SemiBold,
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}
