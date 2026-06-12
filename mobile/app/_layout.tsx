import '../global.css';
import { useEffect } from 'react';
import { LogBox } from 'react-native';
import { Stack } from 'expo-router';
import { ApolloProvider } from '@apollo/client';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { registerGlobals } from '@livekit/react-native';
import { client } from '@/src/graphql/apollo-client';
import { useAuthStore } from '@/src/store/auth/auth.store';
import { COLORS } from '@/src/libs/constants/colors';

const BG = COLORS.bg;

// Install LiveKit/WebRTC globals once at startup (no-op in Expo Go where the
// native WebRTC module is absent — real video requires a dev build).
registerGlobals();

// Dev-only noise: expo-keep-awake can't grab a wake lock on the emulator and
// surfaces it as an unhandled-rejection LogBox toast. Harmless (absent in
// release builds) — silence it so it doesn't cover the UI in dev.
LogBox.ignoreLogs(['Unable to activate keep awake']);

// Keep the native splash up until the persisted auth state is rehydrated,
// so group-layout redirects settle before anything is shown.
SplashScreen.preventAutoHideAsync();

// Root layout: only providers + navigator, NO routing logic.
// Auth redirects live in each group layout using <Redirect>.
export default function RootLayout() {
  const hasHydrated = useAuthStore(s => s.hasHydrated);

  useEffect(() => {
    if (hasHydrated) {
      SplashScreen.hideAsync();
    }
  }, [hasHydrated]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: BG }}>
      <SafeAreaProvider>
        <ApolloProvider client={client}>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: BG } }}>
            <Stack.Screen name="notifications" options={{ presentation: 'modal' }} />
            <Stack.Screen name="edit-profile" />
            <Stack.Screen name="channel/[username]" />
            <Stack.Screen name="settings/change-password" />
            <Stack.Screen name="settings/change-email" />
            <Stack.Screen name="settings/two-factor" />
            <Stack.Screen name="settings/sessions" />
            <Stack.Screen name="settings/stream-keys" />
            <Stack.Screen name="settings/chat-settings" />
          </Stack>
        </ApolloProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
