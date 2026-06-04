import { Redirect, Tabs } from 'expo-router';
import { useAuthStore } from '@/src/store/auth/auth.store';
import { TabBar } from '@/src/components/navigation/TabBar';

export default function TabsLayout() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  // Guard: unauthenticated users sent to login
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      tabBar={props => <TabBar {...props} />}
      screenOptions={{
          headerShown: false,
          tabBarStyle: { backgroundColor: 'transparent', borderTopWidth: 0, elevation: 0 },
        }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="streams" />
      <Tabs.Screen name="go-live" />
      <Tabs.Screen name="following" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
