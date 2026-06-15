import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@/src/store/auth/auth.store';
import { useColors } from '@/src/libs/theme/use-theme';

export default function AuthLayout() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const c = useColors();

  // Guard: already authenticated users sent to main app
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: c.bg },
        animation: 'fade',
      }}
    />
  );
}
