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
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
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
  IconPlayerPlayFilled,
  IconClock,
  IconTrash,
  IconX,
  IconVideo,
} from '@tabler/icons-react-native';
import { COLORS } from '@/src/libs/constants/colors';
import { getMediaSource } from '@/src/libs/utils/get-media-source';
import { getRecordingSource } from '@/src/libs/utils/get-recording-source';
import { useAuthStore } from '@/src/store/auth/auth.store';
import {
  FIND_CHANNEL_BY_USERNAME,
  FIND_RECORDINGS_BY_CHANNEL,
  DELETE_RECORDING,
  FOLLOW_CHANNEL,
  UNFOLLOW_CHANNEL,
  type ChannelInfo,
  type Recording,
} from '@/src/graphql/queries/viewer.queries';
import { FIND_MY_PROFILE, type MyProfile } from '@/src/graphql/queries/profile.queries';
import {
  FIND_MY_FOLLOWINGS,
  type FollowItem,
} from '@/src/graphql/queries/following.queries';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COVER_HEIGHT = 90;
const AVATAR_SIZE  = 60;
const CLIP_W       = (SCREEN_WIDTH - 16 * 2 - 10) / 2;

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

function fmtDuration(sec?: number | null) {
  if (!sec) return null;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ── Live/stream preview card → tap through to the watch page ────

function StreamPreviewCard({
  channel,
  onPress,
}: {
  channel: ChannelInfo;
  onPress: () => void;
}) {
  const isLive = channel.stream?.isLive ?? false;
  const thumb = getMediaSource(channel.stream?.thumbnailUrl ?? null);

  return (
    <TouchableOpacity style={styles.streamCard} activeOpacity={0.85} onPress={onPress}>
      <View style={styles.streamThumb}>
        {thumb ? (
          <Image source={{ uri: thumb }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={['#0d2b3e', '#1a0d2b']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        )}
        <View style={[StyleSheet.absoluteFillObject, styles.streamScrim]} />

        <View style={styles.streamBadgeRow}>
          {isLive ? (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveBadgeText}>LIVE</Text>
            </View>
          ) : (
            <View style={styles.offlineBadge}>
              <Text style={styles.offlineBadgeText}>OFFLINE</Text>
            </View>
          )}
        </View>

        <View style={styles.streamPlay}>
          <IconPlayerPlayFilled size={26} color="#fff" />
        </View>
      </View>

      <View style={styles.streamMeta}>
        <Text style={styles.streamTitle} numberOfLines={1}>
          {channel.stream?.title || (isLive ? 'Live now' : 'Stream offline')}
        </Text>
        {channel.stream?.category && (
          <Text style={styles.streamCategory}>{channel.stream.category.title}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── VOD player modal ───────────────────────────────────────────

function VodPlayerModal({ recording, onClose }: { recording: Recording; onClose: () => void }) {
  const uri = getRecordingSource(recording.url) ?? '';
  const player = useVideoPlayer(uri, p => { p.play(); });

  return (
    <Modal visible animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.vodModal}>
        <View style={styles.vodHeader}>
          <Text style={styles.vodTitle} numberOfLines={1}>{recording.title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.vodClose} activeOpacity={0.8}>
            <IconX size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        <VideoView player={player} style={styles.vodVideo} nativeControls allowsFullscreen contentFit="contain" />
      </View>
    </Modal>
  );
}

// ── Clips tab (channel recordings) ─────────────────────────────

function ClipsTab({ channelId, isOwner }: { channelId: string; isOwner: boolean }) {
  const { data, refetch, loading } = useQuery<{ findRecordingsByChannel: Recording[] }>(
    FIND_RECORDINGS_BY_CHANNEL,
    { variables: { channelId }, skip: !channelId },
  );
  const [active, setActive] = useState<Recording | null>(null);
  const [deleteRecording] = useMutation(DELETE_RECORDING);

  const recordings = data?.findRecordingsByChannel ?? [];

  const confirmDelete = (recording: Recording) => {
    Alert.alert('Delete video', `Delete "${recording.title}"? This can't be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRecording({ variables: { id: recording.id } });
            await refetch();
          } catch {
            Alert.alert('Error', 'Could not delete the video. Try again.');
          }
        },
      },
    ]);
  };

  if (loading && recordings.length === 0) {
    return (
      <View style={styles.clipsEmpty}>
        <ActivityIndicator color={COLORS.accent} />
      </View>
    );
  }

  if (recordings.length === 0) {
    return (
      <View style={styles.clipsEmpty}>
        <IconVideo size={28} color={COLORS.textMuted} />
        <Text style={styles.clipsEmptyText}>No clips yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.clipsGrid}>
      {recordings.map(item => {
        const thumb = getMediaSource(item.thumbnailUrl);
        const dur = fmtDuration(item.duration);
        return (
          <TouchableOpacity key={item.id} style={styles.clipCard} activeOpacity={0.8} onPress={() => setActive(item)}>
            <View style={styles.clipThumb}>
              {thumb ? (
                <Image source={{ uri: thumb }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
              ) : (
                <View style={[StyleSheet.absoluteFillObject, styles.clipThumbFallback]}>
                  <IconVideo size={20} color={COLORS.textMuted} />
                </View>
              )}
              <View style={styles.clipPlay}>
                <IconPlayerPlayFilled size={14} color="#fff" />
              </View>
              {isOwner && (
                <TouchableOpacity style={styles.clipDelete} activeOpacity={0.8} onPress={() => confirmDelete(item)}>
                  <IconTrash size={13} color="#fff" />
                </TouchableOpacity>
              )}
              {dur && (
                <View style={styles.clipDuration}>
                  <IconClock size={9} color="#fff" />
                  <Text style={styles.clipDurationText}>{dur}</Text>
                </View>
              )}
            </View>
            <Text style={styles.clipTitle} numberOfLines={2}>{item.title}</Text>
          </TouchableOpacity>
        );
      })}
      {active && <VodPlayerModal recording={active} onClose={() => setActive(null)} />}
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
              <Text style={styles.streamRowCategory}>{channel.stream.category.title}</Text>
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
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const [activeTab, setActiveTab] = useState<ChannelTab>('Clips');

  const { data, loading, error } = useQuery<{ findChannelByUsername: ChannelInfo }>(
    FIND_CHANNEL_BY_USERNAME,
    { variables: { username } },
  );

  const { data: profileData } = useQuery<{ findProfile: MyProfile }>(
    FIND_MY_PROFILE,
    { skip: !isAuthenticated },
  );

  const { data: followingsData, refetch: refetchFollowings } = useQuery<{
    findMyFollowings: FollowItem[];
  }>(FIND_MY_FOLLOWINGS, { fetchPolicy: 'cache-and-network', skip: !isAuthenticated });

  const channel = data?.findChannelByUsername;

  const isOwner = isAuthenticated && !!channel && profileData?.findProfile?.id === channel.id;

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

            {!isOwner && (
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
            )}
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
              <Text style={[styles.statVal, isLive && { color: COLORS.accent }]}>
                {isLive ? 'LIVE' : 'OFFLINE'}
              </Text>
              <Text style={styles.statLabel}>Status</Text>
            </View>
          </View>

          {/* Stream preview → watch page */}
          <View style={styles.streamCardWrap}>
            <StreamPreviewCard
              channel={channel}
              onPress={() => router.push(`/stream/${channel.username}` as any)}
            />
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

          {activeTab === 'Clips' && <ClipsTab channelId={channel.id} isOwner={isOwner} />}
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
    minHeight: AVATAR_SIZE / 2 + 4,
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

  // ── Stream preview card
  streamCardWrap: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  streamCard: {
    borderRadius: 12, overflow: 'hidden',
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
  },
  streamThumb: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  streamScrim: { backgroundColor: 'rgba(0,0,0,0.25)' },
  streamBadgeRow: { position: 'absolute', top: 10, left: 10 },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.live, borderRadius: 6,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  liveDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  offlineBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 6,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  offlineBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 0.5 },
  streamPlay: {
    position: 'absolute', top: '50%', left: '50%',
    width: 52, height: 52, borderRadius: 26, marginLeft: -26, marginTop: -26,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  streamMeta: { padding: 12 },
  streamTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  streamCategory: {
    marginTop: 4, alignSelf: 'flex-start',
    fontSize: 11, fontWeight: '600', color: COLORS.accent,
    backgroundColor: 'rgba(24,185,174,0.12)',
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4,
  },

  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginTop: 10,
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

  // ── Clips grid
  clipsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, paddingTop: 12, gap: 10,
  },
  clipCard: { width: CLIP_W },
  clipThumb: {
    width: CLIP_W, aspectRatio: 16 / 9, borderRadius: 8, overflow: 'hidden',
    backgroundColor: COLORS.card,
  },
  clipThumbFallback: { alignItems: 'center', justifyContent: 'center' },
  clipPlay: {
    position: 'absolute', top: '50%', left: '50%',
    width: 30, height: 30, borderRadius: 15, marginLeft: -15, marginTop: -15,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  clipDelete: {
    position: 'absolute', top: 5, right: 5,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  clipDuration: {
    position: 'absolute', bottom: 5, right: 5,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 4,
    paddingHorizontal: 5, paddingVertical: 2,
  },
  clipDurationText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  clipTitle: { marginTop: 6, fontSize: 12, color: COLORS.textPrimary, lineHeight: 16 },
  clipsEmpty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 8 },
  clipsEmptyText: { color: COLORS.textMuted, fontSize: 13 },

  // ── VOD player modal
  vodModal: { flex: 1, backgroundColor: '#000' },
  vodHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingTop: 48, paddingBottom: 12, gap: 12,
  },
  vodTitle: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '600' },
  vodClose: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  vodVideo: { flex: 1, width: '100%' },

  // ── About tab
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
  streamRowText:     { flex: 1, fontSize: 13, color: COLORS.textPrimary },
  streamRowCategory: { fontSize: 11, color: COLORS.accent },
  socialRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  socialTitle: { fontSize: 14, color: COLORS.textPrimary },
});
