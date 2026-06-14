import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  IconChevronRight,
  IconKey,
  IconShield,
  IconMail,
  IconDeviceMobile,
  IconLock,
  IconMessage,
  IconMoon,
  IconLanguage,
  IconBell,
  IconLogout,
  IconBroadcast,
} from '@tabler/icons-react-native';
import { COLORS } from '@/src/libs/constants/colors';
import { getMediaSource } from '@/src/libs/utils/get-media-source';
import { useAuthStore } from '@/src/store/auth/auth.store';
import { clearTokens } from '@/src/libs/auth/token-storage';
import {
  FIND_MY_PROFILE,
  LOGOUT_MUTATION,
  type MyProfile,
} from '@/src/graphql/queries/profile.queries';

const AVATAR_SIZE = 44;

// ── Settings list item ────────────────────────────────────────

function SettingsItem({
  icon,
  iconBg,
  label,
  onPress,
  last,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  onPress?: () => void;
  last?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.item, last && styles.itemLast]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.itemIcon, { backgroundColor: iconBg }]}>{icon}</View>
      <Text style={styles.itemLabel}>{label}</Text>
      <IconChevronRight size={20} color={COLORS.textDisabled} />
    </TouchableOpacity>
  );
}

// ── Section ───────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionList}>{children}</View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();
  const setIsAuthenticated = useAuthStore(s => s.setIsAuthenticated);

  const { data, loading, error, refetch } = useQuery<{ findProfile: MyProfile }>(FIND_MY_PROFILE);
  const [refreshing, setRefreshing] = useState(false);
  const [cacheTs, setCacheTs]       = useState(() => Date.now());

  useFocusEffect(useCallback(() => {
    setCacheTs(Date.now());
    refetch();
  }, []));

  const signOut = useCallback(async () => {
    await clearTokens();
    setIsAuthenticated(false);
  }, [setIsAuthenticated]);

  const [logout, { loading: loggingOut }] = useMutation(LOGOUT_MUTATION, {
    // Clear local tokens whether or not the server call succeeds
    onCompleted: signOut,
    onError: signOut,
  });

  const user = data?.findProfile;

  if (loading || !user) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.center}>
          {error
            ? <Text style={styles.errorText}>{error.message}</Text>
            : <ActivityIndicator size="large" color={COLORS.accent} />
          }
        </View>
      </SafeAreaView>
    );
  }

  const base = getMediaSource(user.avatar);
  const avatarUrl = base ? `${base}?v=${cacheTs}` : null;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              setCacheTs(Date.now());
              await refetch();
              setRefreshing(false);
            }}
            tintColor={COLORS.accent}
            colors={[COLORS.accent]}
          />
        }
      >
        {/* Header */}
        <Text style={styles.screenTitle}>Settings</Text>

        {/* Profile shortcut */}
        <TouchableOpacity
          style={styles.profileRow}
          activeOpacity={0.75}
          onPress={() => router.push('/edit-profile' as any)}
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.profileAvatar} />
          ) : (
            <View style={[styles.profileAvatar, styles.profileAvatarFallback]}>
              <Text style={styles.profileAvatarInitial}>
                {user.username.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.displayName}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
          </View>
          <IconChevronRight size={20} color={COLORS.textDisabled} />
        </TouchableOpacity>

        {/* Account */}
        <Section title="Account">
          <SettingsItem icon={<IconKey       size={22} color="#fff" />} iconBg="#7C3AED" label="Change Password"  onPress={() => router.push('/settings/change-password' as any)} />
          <SettingsItem icon={<IconShield    size={22} color="#fff" />} iconBg="#DC2626" label="Two-Factor Auth"  onPress={() => router.push('/settings/two-factor' as any)} />
          <SettingsItem icon={<IconMail      size={22} color="#fff" />} iconBg="#D97706" label="Change Email"     onPress={() => router.push('/settings/change-email' as any)} />
          <SettingsItem icon={<IconDeviceMobile size={22} color="#fff" />} iconBg="#059669" label="Sessions"      onPress={() => router.push('/settings/sessions' as any)} last />
        </Section>

        {/* Stream */}
        <Section title="Stream">
          <SettingsItem icon={<IconBroadcast size={22} color="#fff" />} iconBg="#18B9AE" label="My Channel"    onPress={() => router.push(`/channel/${user.username}` as any)} />
          <SettingsItem icon={<IconLock    size={22} color="#fff" />} iconBg="#2563EB" label="Stream Keys"   onPress={() => router.push('/settings/stream-keys' as any)} />
          <SettingsItem icon={<IconMessage size={22} color="#fff" />} iconBg="#DB2777" label="Chat Settings" onPress={() => router.push('/settings/chat-settings' as any)} last />
        </Section>

        {/* App */}
        <Section title="App">
          <SettingsItem icon={<IconMoon     size={22} color="#fff" />} iconBg="#374151" label="Appearance" />
          <SettingsItem icon={<IconLanguage size={22} color="#fff" />} iconBg="#374151" label="Language" />
          <SettingsItem
            icon={<IconBell size={22} color="#fff" />}
            iconBg="#374151"
            label="Notifications"
            onPress={() => router.push('/notifications' as any)}
            last
          />
        </Section>

        {/* Sign out */}
        <View style={styles.signOutWrap}>
          <TouchableOpacity
            style={styles.signOutBtn}
            activeOpacity={0.8}
            onPress={() => logout()}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <ActivityIndicator size="small" color={COLORS.danger} />
            ) : (
              <>
                <IconLogout size={16} color={COLORS.danger} />
                <Text style={styles.signOutText}>Sign Out</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: COLORS.danger, textAlign: 'center', padding: 20 },

  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
  },

  // Profile row
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    backgroundColor: COLORS.card,
    borderRadius: 14,
  },
  profileAvatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  profileAvatarFallback: {
    backgroundColor: '#2A2D3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarInitial: { fontSize: 18, fontWeight: '700', color: COLORS.accent },
  profileInfo: { flex: 1 },
  profileName:  { fontSize: 17, fontWeight: '600', color: COLORS.textPrimary },
  profileEmail: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },

  // Section
  section: { paddingHorizontal: 16, paddingTop: 0, paddingBottom: 4, marginBottom: 8 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  sectionList: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    overflow: 'hidden',
  },

  // Item
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2230',
  },
  itemLast: { borderBottomWidth: 0 },
  itemIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemLabel: { flex: 1, fontSize: 16, color: COLORS.textPrimary },

  // Sign out
  signOutWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(229,62,62,0.1)',
    borderRadius: 14,
    paddingVertical: 14,
  },
  signOutText: { color: COLORS.danger, fontWeight: '600', fontSize: 14 },
});
