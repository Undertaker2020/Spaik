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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as ImagePicker from 'expo-image-picker';
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
  IconCamera,
  IconHeart,
  IconStar,
} from '@tabler/icons-react-native';
import { useColors, useThemedStyles } from '@/src/libs/theme/use-theme';
import type { Palette } from '@/src/libs/theme/palettes';
import { MEDIA_SERVICE_URL } from '@/src/libs/constants/url.constants';
import { getMediaSource } from '@/src/libs/utils/get-media-source';
import { getRecordingSource } from '@/src/libs/utils/get-recording-source';
import { getAccessToken } from '@/src/libs/auth/token-storage';
import { useAuthStore } from '@/src/store/auth/auth.store';
import {
  FIND_CHANNEL_BY_USERNAME,
  FIND_RECORDINGS_BY_CHANNEL,
  DELETE_RECORDING,
  REMOVE_CHANNEL_BANNER,
  FIND_SPONSORS_BY_CHANNEL,
  MAKE_PAYMENT,
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

const CHANNEL_TABS = ['Home', 'About'] as const;
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

function formatCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return `${n}`;
}

// ── Live/stream preview card → tap through to the watch page ────

function StreamPreviewCard({
  channel,
  onPress,
}: {
  channel: ChannelInfo;
  onPress: () => void;
}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
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
        <Text style={[styles.streamLabel, !isLive && styles.streamLabelOffline]}>
          {isLive ? 'Live' : 'Offline'}
        </Text>
        <Text style={styles.streamTitle} numberOfLines={2}>
          {channel.stream?.title || (isLive ? t('channel.liveNow') : t('channel.streamOffline'))}
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
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
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
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  const { data, refetch, loading } = useQuery<{ findRecordingsByChannel: Recording[] }>(
    FIND_RECORDINGS_BY_CHANNEL,
    { variables: { channelId }, skip: !channelId },
  );
  const [active, setActive] = useState<Recording | null>(null);
  const [deleteRecording] = useMutation(DELETE_RECORDING);

  const recordings = data?.findRecordingsByChannel ?? [];

  const confirmDelete = (recording: Recording) => {
    Alert.alert(t('channel.alerts.deleteTitle'), t('channel.alerts.deleteMsg', { title: recording.title }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRecording({ variables: { id: recording.id } });
            await refetch();
          } catch {
            Alert.alert(t('common.errorTitle'), t('channel.alerts.deleteFailed'));
          }
        },
      },
    ]);
  };

  if (loading && recordings.length === 0) {
    return (
      <View style={styles.clipsEmpty}>
        <ActivityIndicator color={c.accent} />
      </View>
    );
  }

  if (recordings.length === 0) {
    return (
      <View style={styles.clipsEmpty}>
        <IconVideo size={28} color={c.textMuted} />
        <Text style={styles.clipsEmptyText}>{t('channel.clips.empty')}</Text>
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
                  <IconVideo size={20} color={c.textMuted} />
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
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  return (
    <View style={styles.aboutWrap}>
      {channel.bio ? (
        <View style={styles.aboutSection}>
          <Text style={styles.aboutSectionTitle}>{t('channel.about.bio')}</Text>
          <Text style={styles.aboutBio}>{channel.bio}</Text>
        </View>
      ) : null}

      {channel.stream?.title ? (
        <View style={styles.aboutSection}>
          <Text style={styles.aboutSectionTitle}>{t('channel.about.stream')}</Text>
          <View style={styles.streamRow}>
            <IconBroadcast size={14} color={c.accent} />
            <Text style={styles.streamRowText}>{channel.stream.title}</Text>
            {channel.stream.category && (
              <Text style={styles.streamRowCategory}>{channel.stream.category.title}</Text>
            )}
          </View>
        </View>
      ) : null}

      {(channel.socialLinks?.length ?? 0) > 0 && (
        <View style={styles.aboutSection}>
          <Text style={styles.aboutSectionTitle}>{t('channel.about.links')}</Text>
          {channel.socialLinks!.map(link => {
            const Icon = socialIcon(link.title);
            return (
              <TouchableOpacity
                key={link.id}
                style={styles.socialRow}
                onPress={() => Linking.openURL(link.url)}
                activeOpacity={0.7}
              >
                <Icon size={16} color={c.accent} />
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
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const { username } = useLocalSearchParams<{ username: string }>();
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const [activeTab, setActiveTab] = useState<ChannelTab>('Home');

  const { data, loading, error, refetch: refetchChannel } = useQuery<{
    findChannelByUsername: ChannelInfo;
  }>(FIND_CHANNEL_BY_USERNAME, { variables: { username } });

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

  // ── Sponsorship (Subscribe) ──────────────────────────────────
  const { data: sponsorsData } = useQuery<{ findSponsorsByChannel: { user: { id: string } }[] }>(
    FIND_SPONSORS_BY_CHANNEL,
    { variables: { channelId: channel?.id }, skip: !channel?.id },
  );
  const myId = profileData?.findProfile?.id;
  const isSponsor = !!(myId && sponsorsData?.findSponsorsByChannel?.some(s => s.user.id === myId));
  const plans = channel?.sponsorshipPlans ?? [];
  const [subscribeOpen, setSubscribeOpen] = useState(false);

  const [makePayment, { loading: paying }] = useMutation(MAKE_PAYMENT, {
    onCompleted: (d: { makePayment: { url: string } }) => {
      setSubscribeOpen(false);
      Linking.openURL(d.makePayment.url);
    },
    onError: () => Alert.alert('Payment unavailable', 'Could not start the payment right now. Please try again later.'),
  });

  const isBusy = following || unfollowing;
  const avatarUrl = getMediaSource(channel?.avatar ?? null);
  const bannerUrl = getMediaSource(channel?.banner ?? null);
  const isLive    = channel?.stream?.isLive ?? false;

  // ── Banner upload (owner only) ───────────────────────────────
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const [removeBanner, { loading: removingBanner }] = useMutation(REMOVE_CHANNEL_BANNER, {
    onCompleted: () => refetchChannel(),
    onError: (e) => Alert.alert('Error', e.message),
  });

  async function pickBanner() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('channel.alerts.bannerPermissionTitle'), t('channel.alerts.bannerPermissionMsg'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 1],
      quality: 0.9,
    });
    if (result.canceled) return;
    await uploadBanner(result.assets[0].uri);
  }

  async function uploadBanner(uri: string) {
    setUploadingBanner(true);
    try {
      const token = await getAccessToken();
      const body = new FormData();
      body.append('operations', JSON.stringify({
        query: 'mutation ChangeChannelBanner($banner: Upload!) { changeChannelBanner(banner: $banner) }',
        variables: { banner: null },
      }));
      body.append('map', JSON.stringify({ '0': ['variables.banner'] }));
      body.append('0', { uri, type: 'image/jpeg', name: 'banner.jpg' } as any);

      const res = await fetch(MEDIA_SERVICE_URL, {
        method: 'POST',
        body,
        headers: {
          'Apollo-Require-Preflight': 'true',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const json = await res.json();
      if (json.errors?.length) throw new Error(json.errors[0].message);

      await refetchChannel();
    } catch (e: any) {
      Alert.alert(t('channel.alerts.uploadFailed'), e.message);
    } finally {
      setUploadingBanner(false);
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={[]}>
      {/* Back button overlay — offset below the notch/status bar; the banner
          goes full-bleed under it (Twitch-style). */}
      <TouchableOpacity
        style={[styles.backBtn, { top: insets.top + 8 }]}
        onPress={() => router.back()}
        activeOpacity={0.8}
      >
        <IconArrowLeft size={20} color={c.textPrimary} />
      </TouchableOpacity>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={c.accent} />
        </View>
      ) : error || !channel ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error?.message ?? t('channel.notFound')}</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Cover (banner image, else gradient) — extends under the status bar */}
          <View style={[styles.coverWrap, { height: COVER_HEIGHT + insets.top }]}>
            {bannerUrl ? (
              <Image source={{ uri: bannerUrl }} style={styles.cover} resizeMode="cover" />
            ) : (
              <LinearGradient
                colors={['#0d2b3e', '#1a0d2b', '#2b1a0d']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cover}
              />
            )}

            {isOwner && (
              <View style={[styles.coverActions, { top: insets.top + 8 }]}>
                {channel.banner && !uploadingBanner && (
                  <TouchableOpacity
                    style={styles.coverBtn}
                    onPress={() => removeBanner()}
                    disabled={removingBanner}
                    activeOpacity={0.8}
                  >
                    <IconTrash size={16} color="#fff" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.coverBtn}
                  onPress={pickBanner}
                  disabled={uploadingBanner}
                  activeOpacity={0.8}
                >
                  {uploadingBanner
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <IconCamera size={16} color="#fff" />}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Identity: avatar + name + live/category */}
          <View style={styles.identityRow}>
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

            <View style={styles.identityMeta}>
              <View style={styles.nameRow}>
                <Text style={styles.displayName} numberOfLines={1}>{channel.displayName}</Text>
                {channel.isVerified && <IconBadge size={16} color={c.accent} />}
              </View>
              {isLive ? (
                <View style={styles.liveLine}>
                  <View style={styles.livePill}>
                    <Text style={styles.liveText}>LIVE</Text>
                  </View>
                  {channel.stream?.category && (
                    <Text style={styles.identityCategory} numberOfLines={1}>
                      {channel.stream.category.title}
                    </Text>
                  )}
                </View>
              ) : (
                <Text style={styles.username}>@{channel.username}</Text>
              )}
            </View>
          </View>

          {/* Bio */}
          {channel.bio ? (
            <Text style={styles.bioLine} numberOfLines={2}>{channel.bio}</Text>
          ) : null}

          {/* Followers */}
          <Text style={styles.followers}>
            <Text style={styles.followersCount}>{formatCount(channel.followers?.length ?? 0)}</Text> {t('channel.followers')}
          </Text>

          {/* Social links */}
          {(channel.socialLinks?.length ?? 0) > 0 && (
            <View style={styles.socialChips}>
              {channel.socialLinks!.map(link => {
                const Icon = socialIcon(link.title);
                return (
                  <TouchableOpacity
                    key={link.id}
                    style={styles.socialChip}
                    onPress={() => Linking.openURL(link.url)}
                    activeOpacity={0.7}
                  >
                    <Icon size={15} color={c.accent} />
                    <Text style={styles.socialChipText} numberOfLines={1}>{link.title}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Actions: Follow + Subscribe */}
          {!isOwner && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.followBtn, styles.actionFlex, isFollowing && styles.followBtnActive]}
                activeOpacity={0.85}
                disabled={isBusy}
                onPress={() => isFollowing ? unfollow() : follow()}
              >
                {isBusy ? (
                  <ActivityIndicator size="small" color={isFollowing ? c.textPrimary : '#000'} />
                ) : (
                  <>
                    <IconHeart size={16} color={isFollowing ? c.textPrimary : '#000'} />
                    <Text style={[styles.followBtnText, isFollowing && styles.followBtnTextActive]}>
                      {isFollowing ? t('channel.following') : t('channel.follow')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {channel.isVerified && plans.length > 0 && (
                isSponsor ? (
                  <View style={[styles.subscribeBtn, styles.actionFlex, styles.subscribedBtn]}>
                    <IconStar size={16} color={c.textSecondary} />
                    <Text style={styles.subscribedText}>{t('channel.subscribed')}</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.subscribeBtn, styles.actionFlex]}
                    activeOpacity={0.85}
                    onPress={() => setSubscribeOpen(true)}
                  >
                    <IconStar size={16} color="#fff" />
                    <Text style={styles.subscribeText}>{t('channel.subscribe')}</Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          )}

          {/* Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabBar}
            contentContainerStyle={styles.tabBarContent}
          >
            {CHANNEL_TABS.map(tab => (
              <TouchableOpacity
                key={tab}
                style={styles.tabItem}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
                  {tab === 'Home' ? t('channel.tabs.home') : t('channel.tabs.about')}
                </Text>
                {activeTab === tab && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {activeTab === 'Home' && (
            <>
              <View style={styles.streamCardWrap}>
                <StreamPreviewCard
                  channel={channel}
                  onPress={() => router.push(`/stream/${channel.username}` as any)}
                />
              </View>
              <ClipsTab channelId={channel.id} isOwner={isOwner} />
            </>
          )}
          {activeTab === 'About' && <AboutTab channel={channel} />}

        </ScrollView>
      )}

      {channel && (
        <Modal
          visible={subscribeOpen}
          animationType="slide"
          transparent
          onRequestClose={() => setSubscribeOpen(false)}
        >
          <View style={styles.subBackdrop}>
            <View style={styles.subSheet}>
              <View style={styles.subHeader}>
                <Text style={styles.subTitle} numberOfLines={1}>{t('channel.subscribeModal.support', { name: channel.displayName })}</Text>
                <TouchableOpacity onPress={() => setSubscribeOpen(false)} hitSlop={8}>
                  <IconX size={22} color={c.textPrimary} />
                </TouchableOpacity>
              </View>

              {plans.map(plan => (
                <TouchableOpacity
                  key={plan.id}
                  style={styles.planCard}
                  activeOpacity={0.8}
                  disabled={paying}
                  onPress={() => makePayment({ variables: { planId: plan.id } })}
                >
                  <View style={styles.planInfo}>
                    <Text style={styles.planTitle}>{plan.title}</Text>
                    {plan.description ? (
                      <Text style={styles.planDesc} numberOfLines={2}>{plan.description}</Text>
                    ) : null}
                  </View>
                  <Text style={styles.planPrice}>${plan.price.toFixed(2)}{t('channel.subscribeModal.perMonth')}</Text>
                </TouchableOpacity>
              ))}

              {paying && <ActivityIndicator color={c.accent} style={{ marginTop: 8 }} />}
              <Text style={styles.subHint}>{t('channel.subscribeModal.hint')}</Text>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
  root:      { flex: 1, backgroundColor: c.bg },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: c.danger, textAlign: 'center', padding: 20 },

  backBtn: {
    position: 'absolute',
    left: 12,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  coverWrap: { position: 'relative' },
  cover: { height: '100%', width: '100%' },
  coverActions: {
    position: 'absolute', right: 10,
    flexDirection: 'row', gap: 8,
  },
  coverBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },

  identityRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: -(AVATAR_SIZE / 2) - 4,
    marginBottom: 8,
  },
  avatarWrap: {
    borderRadius: (AVATAR_SIZE + 6) / 2,
    padding: 3,
    backgroundColor: c.bg,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarFallback: {
    backgroundColor: c.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 22, fontWeight: '700', color: c.accent },

  identityMeta: { flex: 1, paddingBottom: 4 },
  nameRow:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  displayName: { fontSize: 20, fontWeight: '800', color: c.textPrimary, flexShrink: 1 },
  liveLine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 },
  livePill: {
    backgroundColor: c.live,
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  liveText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  identityCategory: { flexShrink: 1, fontSize: 13, color: c.textSecondary },
  username: { fontSize: 13, color: c.textSecondary, marginTop: 5 },

  bioLine: { paddingHorizontal: 16, fontSize: 13, color: c.textSecondary, lineHeight: 18, marginBottom: 8 },

  followers: { paddingHorizontal: 16, fontSize: 13, color: c.textSecondary, marginBottom: 8 },
  followersCount: { fontWeight: '800', color: c.textPrimary },

  socialChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginBottom: 8 },
  socialChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: c.card, borderWidth: 1, borderColor: c.border,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
  },
  socialChipText: { fontSize: 12, color: c.textPrimary, fontWeight: '600' },

  actionRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 12 },
  actionFlex: { flex: 1 },
  followBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 42, borderRadius: 8,
    backgroundColor: c.accent,
  },
  followBtnActive: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: c.border,
  },
  followBtnText:       { fontSize: 14, fontWeight: '700', color: '#000' },
  followBtnTextActive: { color: c.textPrimary },
  subscribeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 42, borderRadius: 8,
    backgroundColor: c.card, borderWidth: 1, borderColor: c.border,
  },
  subscribeText:   { fontSize: 14, fontWeight: '700', color: c.textPrimary },
  subscribedBtn:   { opacity: 0.7 },
  subscribedText:  { fontSize: 14, fontWeight: '700', color: c.textSecondary },

  // ── Subscribe sheet
  subBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  subSheet: {
    backgroundColor: c.bg, borderTopLeftRadius: 18, borderTopRightRadius: 18,
    padding: 18, paddingBottom: 32, gap: 12,
    borderTopWidth: 1, borderColor: c.border,
  },
  subHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  subTitle:  { flex: 1, fontSize: 16, fontWeight: '700', color: c.textPrimary },
  planCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.border,
    padding: 14,
  },
  planInfo:  { flex: 1, gap: 3 },
  planTitle: { fontSize: 14, fontWeight: '700', color: c.textPrimary },
  planDesc:  { fontSize: 12, color: c.textSecondary, lineHeight: 16 },
  planPrice: { fontSize: 15, fontWeight: '800', color: c.accent },
  subHint:   { fontSize: 12, color: c.textMuted, textAlign: 'center', marginTop: 4 },

  // ── Stream preview card
  streamCardWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 2 },
  streamCard: {
    borderRadius: 12, overflow: 'hidden',
    backgroundColor: c.card, borderWidth: 1, borderColor: c.border,
  },
  streamThumb: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  streamScrim: { backgroundColor: 'rgba(0,0,0,0.25)' },
  streamBadgeRow: { position: 'absolute', top: 10, left: 10 },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: c.live, borderRadius: 6,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  liveDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  offlineBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 6,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  offlineBadgeText: { fontSize: 11, fontWeight: '700', color: c.textSecondary, letterSpacing: 0.5 },
  streamPlay: {
    position: 'absolute', top: '50%', left: '50%',
    width: 52, height: 52, borderRadius: 26, marginLeft: -26, marginTop: -26,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  streamMeta: { padding: 12 },
  streamLabel: {
    fontSize: 11, fontWeight: '700', color: c.accent,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4,
  },
  streamLabelOffline: { color: c.textMuted },
  streamTitle: { fontSize: 15, fontWeight: '700', color: c.textPrimary, lineHeight: 20 },
  streamCategory: {
    marginTop: 6, alignSelf: 'flex-start',
    fontSize: 11, fontWeight: '600', color: c.accent,
    backgroundColor: 'rgba(24,185,174,0.12)',
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4,
  },

  tabBar: {
    borderBottomWidth: 1,
    borderBottomColor: c.border,
    marginTop: 6,
    flexGrow: 0,
  },
  tabBarContent: { paddingHorizontal: 16, gap: 24 },
  tabItem: {
    paddingVertical: 12,
    position: 'relative',
  },
  tabLabel:       { fontSize: 14, color: c.textSecondary, fontWeight: '600' },
  tabLabelActive: { color: c.textPrimary },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: c.accent,
    borderRadius: 2,
  },

  // ── Clips grid
  clipsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, gap: 10,
  },
  clipCard: { width: CLIP_W },
  clipThumb: {
    width: CLIP_W, aspectRatio: 16 / 9, borderRadius: 8, overflow: 'hidden',
    backgroundColor: c.card,
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
  clipTitle: { marginTop: 6, fontSize: 12, color: c.textPrimary, lineHeight: 16 },
  clipsEmpty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 28, gap: 8 },
  clipsEmptyText: { color: c.textMuted, fontSize: 13 },

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
    fontSize: 11, fontWeight: '600', color: c.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
  },
  aboutBio: { fontSize: 14, color: c.textPrimary, lineHeight: 20 },
  streamRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: c.card, borderRadius: 10,
    padding: 12, borderWidth: 1, borderColor: c.border,
  },
  streamRowText:     { flex: 1, fontSize: 13, color: c.textPrimary },
  streamRowCategory: { fontSize: 11, color: c.accent },
  socialRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border,
  },
  socialTitle: { fontSize: 14, color: c.textPrimary },
});
