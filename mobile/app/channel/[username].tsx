import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { LinearGradient } from 'expo-linear-gradient';
import {
  IconArrowLeft,
  IconBadge,
  IconBroadcast,
  IconLink,
  IconBrandTwitter,
  IconBrandInstagram,
  IconBrandYoutube,
  IconBrandTwitch,
  IconBrandDiscord,
  IconBrandTelegram,
  IconBrandGithub,
} from '@tabler/icons-react-native';
import { COLORS } from '@/src/libs/constants/colors';
import { getMediaSource } from '@/src/libs/utils/get-media-source';
import {
  FIND_CHANNEL_BY_USERNAME,
  FOLLOW_CHANNEL,
  UNFOLLOW_CHANNEL,
  type ChannelInfo,
} from '@/src/graphql/queries/viewer.queries';
import {
  FIND_MY_FOLLOWINGS,
  type FollowItem,
} from '@/src/graphql/queries/following.queries';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COVER_HEIGHT = 90;
const AVATAR_SIZE  = 60;
const CLIP_SIZE    = (SCREEN_WIDTH - 2) / 3;

const CHANNEL_TABS = ['Clips', 'About'] as const;
type ChannelTab = typeof CHANNEL_TABS[number];

function socialIcon(title: string) {
  const t = title.toLowerCase();
  if (t.includes('twitter') || t.includes('x.com'))  return IconBrandTwitter;
  if (t.includes('instagram'))                         return IconBrandInstagram;
  if (t.includes('youtube'))                           return IconBrandYoutube;
  if (t.includes('twitch'))                            return IconBrandTwitch;
  if (t.includes('discord'))                           return IconBrandDiscord;
  if (t.includes('telegram'))                          return IconBrandTelegram;
  if (t.includes('github'))                            return IconBrandGithub;
  return IconLink;
}

// ── Clips placeholder ─────────────────────────────────────────

function ClipsTab() {
  const colors: [string, string][] = [
    ['#1e3a5f', '#2d1b4e'], ['#2a1a1a', '#3a0d0d'], ['#1a2a1a', '#0d3a0d'],
    ['#2a2a1a', '#3a3a0d'], ['#1a1a3a', '#0d0d3a'], ['#2a1a2a', '#3a0d3a'],
  ];
  return (
    <View style={styles.clipsGrid}>
      {colors.map((c, i) => (
        <LinearGradient key={i} colors={c} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.clipThumb} />
      ))}
    </View>
  );
}

// ── About tab ─────────────────────────────────────────────────

function AboutTab({ channel }: { channel: ChannelInfo }) {
  return (
    <View style={styles.aboutWrap}>
      {channel.bio ? (
        <View style={styles.aboutSection}>
          <Text style={styles.aboutSectionTitle}>Bio</Text>
          <Text style={styles.aboutBio}>{channel.bio}</Text>
        </View>
      ) : null}

      {channel.stream?.title ? (
        <View style={styles.aboutSection}>
          <Text style={styles.aboutSectionTitle}>Stream</Text>
          <View style={styles.streamRow}>
            <IconBroadcast size={14} color={COLORS.accent} />
            <Text style={styles.streamRowText}>{channel.stream.title}</Text>
            {channel.stream.category && (
              <Text style={styles.streamCategory}>{channel.stream.category.title}</Text>
            )}
          </View>
        </View>
      ) : null}

      {(channel.socialLinks?.length ?? 0) > 0 && (
        <View style={styles.aboutSection}>
          <Text style={styles.aboutSectionTitle}>Links</Text>
          {channel.socialLinks!.map(link => {
            const Icon = socialIcon(link.title);
            return (
              <TouchableOpacity
                key={link.id}
                style={styles.socialRow}
                onPress={() => Linking.openURL(link.url)}
                activeOpacity={0.7}
              >
                <Icon size={16} color={COLORS.accent} />
                <Text style={styles.socialTitle}>{link.title}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────

export default function ChannelScreen() {
  const router   = useRouter();
  const { username } = useLocalSearchParams<{ username: string }>();
  const [activeTab, setActiveTab] = useState<ChannelTab>('Clips');

  const { data, loading, error } = useQuery<{ findChannelByUsername: ChannelInfo }>(
    FIND_CHANNEL_BY_USERNAME,
    { variables: { username } },
  );

  const { data: followingsData, refetch: refetchFollowings } = useQuery<{
    findMyFollowings: FollowItem[];
  }>(FIND_MY_FOLLOWINGS, { fetchPolicy: 'cache-and-network' });

  const channel = data?.findChannelByUsername;

  const isFollowing = !!(channel && followingsData?.findMyFollowings.some(
    f => f.following.id === channel.id,
  ));

  const [follow, { loading: following }] = useMutation(FOLLOW_CHANNEL, {
    variables: { channelId: channel?.id },
    onCompleted: () => refetchFollowings(),
  });

  const [unfollow, { loading: unfollowing }] = useMutation(UNFOLLOW_CHANNEL, {
    variables: { channelId: channel?.id },
    onCompleted: () => refetchFollowings(),
  });

  const isBusy = following || unfollowing;
  const avatarUrl = getMediaSource(channel?.avatar ?? null);
  const isLive    = channel?.stream?.isLive ?? false;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Back button overlay */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
        <IconArrowLeft size={20} color={COLORS.textPrimary} />
      </TouchableOpacity>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : error || !channel ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error?.message ?? 'Channel not found'}</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Cover */}
          <LinearGradient
            colors={['#0d2b3e', '#1a0d2b', '#2b1a0d']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cover}
          />

          {/* Avatar row */}
          <View style={styles.avatarRow}>
            <View style={styles.avatarWrap}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarInitial}>
                    {channel.username.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.followBtn, isFollowing && styles.followBtnActive]}
              activeOpacity={0.8}
              disabled={isBusy}
              onPress={() => isFollowing ? unfollow() : follow()}
            >
              {isBusy ? (
                <ActivityIndicator size="small" color={isFollowing ? COLORS.textPrimary : '#000'} />
              ) : (
                <Text style={[styles.followBtnText, isFollowing && styles.followBtnTextActive]}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Info */}
          <View style={styles.infoWrap}>
            <View style={styles.nameRow}>
              <Text style={styles.displayName}>{channel.displayName}</Text>
              {channel.isVerified && <IconBadge size={16} color={COLORS.accent} />}
              {isLive && (
                <View style={styles.livePill}>
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              )}
            </View>
            <Text style={styles.username}>@{channel.username}</Text>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statVal}>{channel.followers?.length ?? 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statVal}>{channel.followings?.length ?? 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statVal}>0</Text>
              <Text style={styles.statLabel}>Streams</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={[styles.statVal, isLive && { color: COLORS.accent }]}>
                {isLive ? 'LIVE' : 'OFFLINE'}
              </Text>
              <Text style={styles.statLabel}>Status</Text>
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabBar}>
            {CHANNEL_TABS.map(tab => (
              <TouchableOpacity
                key={tab}
                style={styles.tabItem}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
                  {tab}
                </Text>
                {activeTab === tab && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === 'Clips' && <ClipsTab />}
          {activeTab === 'About' && <AboutTab channel={channel} />}

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:      { flex: 1, backgroundColor: COLORS.bg },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: COLORS.danger, textAlign: 'center', padding: 20 },

  backBtn: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cover: { height: COVER_HEIGHT },

  avatarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: -(AVATAR_SIZE / 2) - 4,
    marginBottom: 10,
  },
  avatarWrap: {
    borderRadius: (AVATAR_SIZE + 6) / 2,
    padding: 3,
    backgroundColor: COLORS.bg,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarFallback: {
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 22, fontWeight: '700', color: COLORS.accent },

  followBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: COLORS.accent,
    marginBottom: 4,
    minWidth: 90,
    alignItems: 'center',
  },
  followBtnActive: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  followBtnText:       { fontSize: 13, fontWeight: '700', color: '#000' },
  followBtnTextActive: { color: COLORS.textPrimary },

  infoWrap: { paddingHorizontal: 16, marginBottom: 12 },
  nameRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  displayName: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  username:    { fontSize: 13, color: COLORS.textSecondary },
  livePill: {
    backgroundColor: COLORS.live,
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  liveText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 10,
  },
  stat:      { flex: 1, alignItems: 'center' },
  statVal:   { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 1 },
  statLabel: { fontSize: 10, color: COLORS.textSecondary },
  statDivider: { width: 1, backgroundColor: COLORS.border, marginVertical: 4 },

  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    position: 'relative',
  },
  tabLabel:       { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  tabLabelActive: { color: COLORS.accent },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    width: '60%',
    backgroundColor: COLORS.accent,
    borderRadius: 1,
  },

  clipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 1, paddingTop: 1 },
  clipThumb: { width: CLIP_SIZE, aspectRatio: 9 / 16 },

  aboutWrap:         { paddingBottom: 32 },
  aboutSection:      { paddingHorizontal: 16, paddingTop: 16 },
  aboutSectionTitle: {
    fontSize: 11, fontWeight: '600', color: COLORS.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
  },
  aboutBio: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 20 },
  streamRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.card, borderRadius: 10,
    padding: 12, borderWidth: 1, borderColor: COLORS.border,
  },
  streamRowText:  { flex: 1, fontSize: 13, color: COLORS.textPrimary },
  streamCategory: { fontSize: 11, color: COLORS.accent },
  socialRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  socialTitle: { fontSize: 14, color: COLORS.textPrimary },
});
