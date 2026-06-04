import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@apollo/client';
import { useRouter } from 'expo-router';
import { IconBadge, IconUsers } from '@tabler/icons-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/src/libs/constants/colors';
import { getMediaSource } from '@/src/libs/utils/get-media-source';
import {
  FIND_MY_FOLLOWINGS,
  type FollowItem,
  type FollowingChannel,
} from '@/src/graphql/queries/following.queries';

const { width: W } = Dimensions.get('window');
const H_PAD   = 16;
const LIVE_H  = 160;
const OFF_W   = (W - H_PAD * 2 - 12) / 2;

// ── Section header ────────────────────────────────────────────

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleWrap}>
        <View style={styles.sectionAccent} />
        <Text style={styles.sectionLabel}>{label}</Text>
      </View>
      <View style={styles.sectionBadge}>
        <Text style={styles.sectionBadgeText}>{count}</Text>
      </View>
    </View>
  );
}

// ── Live channel card (full-width) ────────────────────────────

function LiveCard({ channel }: { channel: FollowingChannel }) {
  const router    = useRouter();
  const thumb     = getMediaSource(channel.stream?.thumbnailUrl ?? null);
  const avatar    = getMediaSource(channel.avatar);

  return (
    <TouchableOpacity
      style={styles.liveCard}
      activeOpacity={0.88}
      onPress={() => router.push(`/stream/${channel.username}` as any)}
    >
      {/* Background */}
      {thumb
        ? <Image source={{ uri: thumb }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        : <LinearGradient colors={['#1e3a5f', '#2d1b4e']} style={StyleSheet.absoluteFill} />
      }

      {/* Gradients */}
      <LinearGradient
        colors={['rgba(0,0,0,0.4)', 'transparent']}
        style={styles.liveCardTopGrad}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.88)']}
        style={styles.liveCardBottomGrad}
      />

      {/* LIVE badge */}
      <View style={styles.liveBadge}>
        <View style={styles.liveDot} />
        <Text style={styles.liveBadgeText}>LIVE</Text>
      </View>

      {/* Category */}
      {channel.stream?.category && (
        <View style={styles.catBadge}>
          <Text style={styles.catBadgeText}>{channel.stream.category.title}</Text>
        </View>
      )}

      {/* Bottom info */}
      <View style={styles.liveCardInfo}>
        <View style={styles.liveCardRow}>
          <View>
            {avatar
              ? <Image source={{ uri: avatar }} style={styles.liveAvatar} />
              : <View style={[styles.liveAvatar, styles.avatarFallback]}>
                  <Text style={styles.avatarInitial}>
                    {channel.username.charAt(0).toUpperCase()}
                  </Text>
                </View>
            }
          </View>
          <View style={styles.liveCardMeta}>
            <View style={styles.liveNameRow}>
              <Text style={styles.liveDisplayName} numberOfLines={1}>{channel.displayName}</Text>
              {channel.isVerified && <IconBadge size={12} color={COLORS.accent} />}
            </View>
            <Text style={styles.liveStreamTitle} numberOfLines={1}>
              {channel.stream?.title ?? 'Live stream'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Offline channel card (2-column grid) ──────────────────────

function OfflineCard({ channel }: { channel: FollowingChannel }) {
  const router = useRouter();
  const avatar = getMediaSource(channel.avatar);

  return (
    <TouchableOpacity
      style={styles.offCard}
      activeOpacity={0.75}
      onPress={() => router.push(`/channel/${channel.username}` as any)}
    >
      {/* Avatar */}
      <View style={styles.offAvatarWrap}>
        {avatar
          ? <Image source={{ uri: avatar }} style={styles.offAvatar} />
          : <View style={[styles.offAvatar, styles.avatarFallback]}>
              <Text style={styles.offAvatarInitial}>
                {channel.username.charAt(0).toUpperCase()}
              </Text>
            </View>
        }
        {/* Offline indicator */}
        <View style={styles.offIndicator} />
      </View>

      <Text style={styles.offName} numberOfLines={1}>{channel.displayName}</Text>
      <Text style={styles.offUsername} numberOfLines={1}>@{channel.username}</Text>
    </TouchableOpacity>
  );
}

// ── Empty state ───────────────────────────────────────────────

function EmptyState() {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIconWrap}>
        <IconUsers size={34} color={COLORS.textMuted} strokeWidth={1.2} />
      </View>
      <Text style={styles.emptyTitle}>Nobody here yet</Text>
      <Text style={styles.emptySub}>Follow channels you like{'\n'}and they'll appear here</Text>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────

export default function FollowingScreen() {
  const router = useRouter();
  const { data, loading, error, refetch } = useQuery<{ findMyFollowings: FollowItem[] }>(
    FIND_MY_FOLLOWINGS,
    { fetchPolicy: 'cache-and-network' }
  );

  const followings = data?.findMyFollowings ?? [];
  const live    = followings.map(f => f.following).filter(c => c.stream?.isLive);
  const offline = followings.map(f => f.following).filter(c => !c.stream?.isLive);

  // Pair offline channels for 2-column grid
  const offlinePairs: [FollowingChannel, FollowingChannel | null][] = [];
  for (let i = 0; i < offline.length; i += 2) {
    offlinePairs.push([offline[i], offline[i + 1] ?? null]);
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Following</Text>
        {followings.length > 0 && (
          <View style={styles.totalBadge}>
            <Text style={styles.totalBadgeText}>{followings.length}</Text>
          </View>
        )}
      </View>

      {loading && followings.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error.message}</Text>
        </View>
      ) : followings.length === 0 ? (
        <EmptyState />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refetch}
              tintColor={COLORS.accent}
              colors={[COLORS.accent]}
            />
          }
        >
          {/* ── Live section ── */}
          {live.length > 0 && (
            <View style={styles.section}>
              <SectionHeader label="Live Now" count={live.length} />
              <View style={styles.liveList}>
                {live.map(ch => <LiveCard key={ch.id} channel={ch} />)}
              </View>
            </View>
          )}

          {/* ── Offline section ── */}
          {offline.length > 0 && (
            <View style={styles.section}>
              <SectionHeader label="Offline" count={offline.length} />
              <View style={styles.offGrid}>
                {offlinePairs.map(([a, b], i) => (
                  <View key={i} style={styles.offRow}>
                    <OfflineCard channel={a} />
                    {b
                      ? <OfflineCard channel={b} />
                      : <View style={{ width: OFF_W }} />
                    }
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: 24 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: H_PAD, paddingTop: 8, paddingBottom: 14,
  },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.textPrimary },
  totalBadge: {
    backgroundColor: COLORS.card, borderRadius: 99,
    paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, borderColor: COLORS.border,
  },
  totalBadgeText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },

  // Section header
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: H_PAD, marginBottom: 12,
  },
  sectionTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionAccent:    { width: 3, height: 15, borderRadius: 2, backgroundColor: COLORS.accent },
  sectionLabel: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  sectionBadge: {
    backgroundColor: COLORS.card, borderRadius: 99,
    paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1, borderColor: COLORS.border,
  },
  sectionBadgeText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },

  // Section wrapper
  section: { marginBottom: 28 },

  // Live cards
  liveList: { paddingHorizontal: H_PAD, gap: 12 },
  liveCard: {
    height: LIVE_H, borderRadius: 16, overflow: 'hidden',
    backgroundColor: COLORS.card,
  },
  liveCardTopGrad:    { position: 'absolute', top: 0, left: 0, right: 0, height: 70 },
  liveCardBottomGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%' },

  liveBadge: {
    position: 'absolute', top: 11, left: 11,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.live, borderRadius: 6,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  liveDot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },

  catBadge: {
    position: 'absolute', top: 11, right: 11,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 6,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  catBadgeText: { color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: '600' },

  liveCardInfo: { position: 'absolute', bottom: 12, left: 12, right: 12 },
  liveCardRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  liveAvatar: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  liveCardMeta: { flex: 1 },
  liveNameRow:  { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  liveDisplayName: { fontSize: 14, fontWeight: '700', color: '#fff' },
  liveStreamTitle: { fontSize: 12, color: 'rgba(255,255,255,0.65)' },

  // Offline grid
  offGrid: { paddingHorizontal: H_PAD, gap: 12 },
  offRow:  { flexDirection: 'row', gap: 12 },

  offCard: {
    width: OFF_W,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.border,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  offAvatarWrap: { position: 'relative', marginBottom: 2 },
  offAvatar: { width: 52, height: 52, borderRadius: 26 },
  offIndicator: {
    position: 'absolute', bottom: 1, right: 1,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: COLORS.textDisabled,
    borderWidth: 2, borderColor: COLORS.card,
  },
  offName:     { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, textAlign: 'center' },
  offUsername: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center' },

  avatarFallback: { backgroundColor: '#2A2D3A', alignItems: 'center', justifyContent: 'center' },
  avatarInitial:      { fontSize: 14, fontWeight: '700', color: COLORS.accent },
  offAvatarInitial:   { fontSize: 18, fontWeight: '700', color: COLORS.accent },

  // Empty
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.card,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4, borderWidth: 1, borderColor: COLORS.border,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  emptySub:   { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 21 },

  errorText: { color: COLORS.danger, textAlign: 'center', padding: 20 },
});
