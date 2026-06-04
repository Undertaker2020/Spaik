import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@/src/store/auth/auth.store';
import { COLORS } from '@/src/libs/constants/colors';

export default function AuthLayout() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  // Guard: already authenticated users sent to main app
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.bg },
        animation: 'fade',
      }}
    />
  );
}
