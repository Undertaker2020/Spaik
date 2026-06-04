import '../global.css';
import { Stack } from 'expo-router';
import { ApolloProvider } from '@apollo/client';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { client } from '@/src/graphql/apollo-client';
import { COLORS } from '@/src/libs/constants/colors';

const BG = COLORS.bg;

// Root layout: only providers + navigator, NO routing logic.
// Auth redirects live in each group layout using <Redirect>.
export default function RootLayout() {
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
