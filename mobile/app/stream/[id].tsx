import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  PanResponder,
  Modal,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import {
  LiveKitRoom,
  VideoTrack,
  useTracks,
  isTrackReference,
  AudioSession,
} from '@livekit/react-native';
import { Track, VideoQuality, type RemoteTrackPublication, type RemoteParticipant } from 'livekit-client';
import { LinearGradient } from 'expo-linear-gradient';
import {
  IconArrowLeft,
  IconBadge,
  IconSend,
  IconVideo,
  IconVideoOff,
  IconUsers,
  IconEye,
  IconSettings,
  IconCheck,
  IconPlayerPlayFilled,
  IconPlayerPauseFilled,
  IconVolume,
  IconVolumeOff,
  IconClock,
  IconX,
} from '@tabler/icons-react-native';
import { COLORS } from '@/src/libs/constants/colors';
import { LIVEKIT_WS_URL } from '@/src/libs/constants/url.constants';
import { getMediaSource } from '@/src/libs/utils/get-media-source';
import { useAuthStore } from '@/src/store/auth/auth.store';
import { FIND_MY_PROFILE, type MyProfile } from '@/src/graphql/queries/profile.queries';
import { GENERATE_STREAM_TOKEN } from '@/src/graphql/queries/stream.queries';
import {
  FIND_CHANNEL_BY_USERNAME,
  FIND_CHAT_MESSAGES,
  CHAT_MESSAGE_ADDED,
  SEND_CHAT_MESSAGE,
  FOLLOW_CHANNEL,
  UNFOLLOW_CHANNEL,
  FIND_RECORDINGS_BY_CHANNEL,
  type ChatMessage,
  type ChannelInfo,
  type Recording,
} from '@/src/graphql/queries/viewer.queries';
import { getRecordingSource } from '@/src/libs/utils/get-recording-source';
import {
  FIND_MY_FOLLOWINGS,
  type FollowItem,
} from '@/src/graphql/queries/following.queries';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_HEIGHT = SCREEN_WIDTH * (9 / 16);
const AVATAR_SIZE  = 46;

// user-colour palette for chat avatars
const USER_COLORS = ['#7C3AED','#DC2626','#D97706','#059669','#2563EB','#DB2777'];
function userColor(username: string) {
  let h = 0;
  for (let i = 0; i < username.length; i++) h = (h * 31 + username.charCodeAt(i)) & 0xffffffff;
  return USER_COLORS[Math.abs(h) % USER_COLORS.length];
}

// ── Video area ─────────────────────────────────────────────────

function VideoArea({
  isLive,
  thumbnail,
  onBack,
  children,
}: {
  isLive: boolean;
  thumbnail: string | null;
  onBack: () => void;
  /** Live video layer. When present, it replaces the thumbnail/offline visuals. */
  children?: ReactNode;
}) {
  const hasVideo = !!children;

  return (
    <View style={styles.video}>
      {/* Background: live video, else thumbnail, else solid black */}
      {hasVideo ? (
        children
      ) : thumbnail ? (
        <Image source={{ uri: thumbnail }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }]} />
      )}

      {/* Overlays only over the static (non-video) background */}
      {!hasVideo && (
        <>
          {/* Dark overlay */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.35)' }]} />

          {/* Bottom gradient */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={[StyleSheet.absoluteFill, { top: '50%' }]}
          />

          {/* Centre icon when no thumbnail */}
          {!thumbnail && (
            <View style={styles.videoCenter}>
              {isLive
                ? <IconVideo    size={36} color="rgba(255,255,255,0.3)" />
                : <IconVideoOff size={36} color="rgba(255,255,255,0.2)" />
              }
              <Text style={styles.videoLabel}>
                {isLive ? 'Connecting…' : 'Stream offline'}
              </Text>
            </View>
          )}
        </>
      )}

      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
        <IconArrowLeft size={20} color="#fff" />
      </TouchableOpacity>

      {/* LIVE badge */}
      {isLive && (
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      )}
    </View>
  );
}

// ── Quality (simulcast layer) options ──────────────────────────

type QualityKey = '720p' | '360p' | '180p';
const QUALITY_OPTIONS: QualityKey[] = ['720p', '360p', '180p'];
const QUALITY_MAP: Record<QualityKey, VideoQuality> = {
  '720p': VideoQuality.HIGH,
  '360p': VideoQuality.MEDIUM,
  '180p': VideoQuality.LOW,
};

// ── Volume slider (core PanResponder — no extra native deps) ────

const SLIDER_W = 84;

function VolumeSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const setFromX = (x: number) => {
    const clamped = Math.max(0, Math.min(SLIDER_W, x));
    onChange(Math.round((clamped / SLIDER_W) * 100));
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: e => setFromX(e.nativeEvent.locationX),
      onPanResponderMove: e => setFromX(e.nativeEvent.locationX),
    }),
  ).current;

  return (
    <View style={styles.sliderHit} {...pan.panHandlers}>
      <View style={styles.sliderTrack}>
        <View style={[styles.sliderFill, { width: `${value}%` }]} />
        <View style={[styles.sliderThumb, { left: (value / 100) * SLIDER_W - 6 }]} />
      </View>
    </View>
  );
}

// ── Live video stage (inside LiveKitRoom context) ──────────────

function LiveStage() {
  // Subscribed camera + mic tracks in the room; the host is the only remote publisher.
  const tracks = useTracks([Track.Source.Camera, Track.Source.Microphone], { onlySubscribed: true });
  const hostTrack = tracks.find(
    t => isTrackReference(t) && t.source === Track.Source.Camera && !t.participant.isLocal,
  );

  const [quality, setQuality] = useState<QualityKey>('720p');
  const [menuOpen, setMenuOpen] = useState(false);
  const [volume, setVolume] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const lastVolume = useRef(100);

  const host =
    hostTrack && isTrackReference(hostTrack) ? (hostTrack.participant as RemoteParticipant) : undefined;
  const cameraPub =
    hostTrack && isTrackReference(hostTrack) ? (hostTrack.publication as RemoteTrackPublication) : undefined;

  // Pin the chosen simulcast layer (skip while paused — the track is disabled).
  useEffect(() => {
    if (!isPaused) cameraPub?.setVideoQuality?.(QUALITY_MAP[quality]);
  }, [cameraPub, quality, isPaused]);

  // Apply playback volume on the host's microphone (persisted in the participant's volumeMap).
  useEffect(() => {
    host?.setVolume(volume / 100, Track.Source.Microphone);
  }, [host, volume]);

  // Pause/resume: stop receiving the host's media to save bandwidth.
  useEffect(() => {
    const micPub = host?.getTrackPublication(Track.Source.Microphone) as RemoteTrackPublication | undefined;
    cameraPub?.setEnabled(!isPaused);
    micPub?.setEnabled(!isPaused);
  }, [host, cameraPub, isPaused]);

  function onVolumeChange(v: number) {
    setVolume(v);
    if (v > 0) lastVolume.current = v;
  }

  function toggleMute() {
    if (volume === 0) {
      setVolume(lastVolume.current || 100);
    } else {
      lastVolume.current = volume;
      setVolume(0);
    }
  }

  if (!hostTrack) {
    return (
      <View style={[StyleSheet.absoluteFill, styles.videoConnecting]}>
        <ActivityIndicator color="#fff" />
        <Text style={styles.videoLabel}>Connecting to stream…</Text>
      </View>
    );
  }

  const VolumeIcon = volume === 0 ? IconVolumeOff : IconVolume;

  return (
    <>
      <VideoTrack trackRef={hostTrack} style={StyleSheet.absoluteFill} objectFit="contain" />

      {/* Paused scrim with a centre resume button */}
      {isPaused && (
        <View style={[StyleSheet.absoluteFill, styles.pausedScrim]}>
          <TouchableOpacity style={styles.bigPlay} onPress={() => setIsPaused(false)} activeOpacity={0.85}>
            <IconPlayerPlayFilled size={26} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom-left playback controls: play/pause, mute, volume */}
      <View style={styles.playback}>
        <TouchableOpacity style={styles.ctrlBtn} onPress={() => setIsPaused(p => !p)} activeOpacity={0.8}>
          {isPaused
            ? <IconPlayerPlayFilled size={15} color="#fff" />
            : <IconPlayerPauseFilled size={15} color="#fff" />}
        </TouchableOpacity>
        <TouchableOpacity style={styles.ctrlBtn} onPress={toggleMute} activeOpacity={0.8}>
          <VolumeIcon size={16} color="#fff" />
        </TouchableOpacity>
        <VolumeSlider value={volume} onChange={onVolumeChange} />
      </View>

      {/* Quality selector */}
      <View style={styles.qualityWrap}>
        {menuOpen && (
          <View style={styles.qualityMenu}>
            {QUALITY_OPTIONS.map(q => (
              <TouchableOpacity
                key={q}
                style={styles.qualityItem}
                onPress={() => { setQuality(q); setMenuOpen(false); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.qualityItemText, q === quality && styles.qualityItemTextActive]}>
                  {q}
                </Text>
                {q === quality && <IconCheck size={14} color={COLORS.accent} />}
              </TouchableOpacity>
            ))}
          </View>
        )}
        <TouchableOpacity
          style={styles.qualityBtn}
          onPress={() => setMenuOpen(o => !o)}
          activeOpacity={0.8}
        >
          <IconSettings size={15} color="#fff" />
          <Text style={styles.qualityBtnText}>{quality}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

// ── Stream info ────────────────────────────────────────────────

function StreamInfo({
  channel,
  isFollowing,
  onFollow,
  followLoading,
}: {
  channel: ChannelInfo;
  isFollowing: boolean;
  onFollow: () => void;
  followLoading: boolean;
}) {
  const avatar = getMediaSource(channel.avatar);
  const stream = channel.stream;
  const isLive = stream?.isLive ?? false;

  return (
    <View style={styles.info}>
      {/* Row: avatar + name/category + follow */}
      <View style={styles.infoRow}>
        <View style={styles.avatarWrap}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>
                {channel.username.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {isLive && <View style={styles.liveRing} />}
        </View>

        <View style={styles.infoMeta}>
          <View style={styles.nameRow}>
            <Text style={styles.displayName} numberOfLines={1}>{channel.displayName}</Text>
            {channel.isVerified && <IconBadge size={14} color={COLORS.accent} />}
          </View>
          {stream?.category && (
            <Text style={styles.categoryTag}>{stream.category.title}</Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.followBtn, isFollowing && styles.followBtnActive]}
          onPress={onFollow}
          disabled={followLoading}
          activeOpacity={0.8}
        >
          {followLoading ? (
            <ActivityIndicator size="small" color={isFollowing ? COLORS.textPrimary : '#000'} />
          ) : (
            <Text style={[styles.followBtnText, isFollowing && styles.followBtnTextActive]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Stream title */}
      {stream?.title ? (
        <Text style={styles.streamTitle} numberOfLines={2}>{stream.title}</Text>
      ) : null}
    </View>
  );
}

// ── Chat header ────────────────────────────────────────────────

function ChatHeader({ count }: { count: number }) {
  return (
    <View style={styles.chatHeader}>
      <View style={styles.chatHeaderLeft}>
        <IconUsers size={14} color={COLORS.accent} />
        <Text style={styles.chatHeaderText}>Live Chat</Text>
      </View>
      <View style={styles.chatHeaderRight}>
        <IconEye size={12} color={COLORS.textMuted} />
        <Text style={styles.chatCount}>{count}</Text>
      </View>
    </View>
  );
}

// ── Chat message ───────────────────────────────────────────────

function ChatMsg({ msg }: { msg: ChatMessage }) {
  const color  = userColor(msg.user.username);
  const avatar = getMediaSource(msg.user.avatar);

  return (
    <View style={styles.msgRow}>
      <View style={[styles.msgAvatar, { backgroundColor: color }]}>
        {avatar
          ? <Image source={{ uri: avatar }} style={styles.msgAvatarImg} />
          : <Text style={styles.msgAvatarInitial}>{msg.user.username.charAt(0).toUpperCase()}</Text>
        }
      </View>
      <View style={styles.msgBubble}>
        <Text style={[styles.msgUser, { color }]}>{msg.user.username}</Text>
        <Text style={styles.msgText}>{msg.text}</Text>
      </View>
    </View>
  );
}

// ── Channel videos (VOD) ───────────────────────────────────────

function fmtDuration(sec?: number | null) {
  if (!sec) return null;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

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

function ChannelVideos({ channelId }: { channelId: string }) {
  const { data } = useQuery<{ findRecordingsByChannel: Recording[] }>(
    FIND_RECORDINGS_BY_CHANNEL,
    { variables: { channelId }, skip: !channelId },
  );
  const [active, setActive] = useState<Recording | null>(null);

  const recordings = data?.findRecordingsByChannel ?? [];
  if (recordings.length === 0) return null;

  return (
    <View style={styles.vodSection}>
      <View style={styles.vodSectionHeader}>
        <IconVideo size={15} color={COLORS.accent} />
        <Text style={styles.vodSectionTitle}>Videos</Text>
      </View>
      <FlatList
        data={recordings}
        keyExtractor={r => r.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.vodList}
        renderItem={({ item }) => {
          const thumb = getMediaSource(item.thumbnailUrl);
          const dur = fmtDuration(item.duration);
          return (
            <TouchableOpacity style={styles.vodCard} activeOpacity={0.8} onPress={() => setActive(item)}>
              <View style={styles.vodThumb}>
                {thumb ? (
                  <Image source={{ uri: thumb }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                ) : (
                  <View style={[StyleSheet.absoluteFill, styles.vodThumbFallback]}>
                    <IconVideo size={22} color={COLORS.textMuted} />
                  </View>
                )}
                <View style={styles.vodPlayBadge}>
                  <IconPlayerPlayFilled size={16} color="#fff" />
                </View>
                {dur && (
                  <View style={styles.vodDuration}>
                    <IconClock size={10} color="#fff" />
                    <Text style={styles.vodDurationText}>{dur}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.vodCardTitle} numberOfLines={2}>{item.title}</Text>
            </TouchableOpacity>
          );
        }}
      />
      {active && <VodPlayerModal recording={active} onClose={() => setActive(null)} />}
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────

export default function StreamViewerScreen() {
  const { id: username } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);

  const { data: channelData, loading: loadingChannel } = useQuery<{
    findChannelByUsername: ChannelInfo;
  }>(FIND_CHANNEL_BY_USERNAME, { variables: { username }, skip: !username });

  const channel  = channelData?.findChannelByUsername;
  const channelId = channel?.id;
  const streamId = channel?.stream?.id;
  const isLive   = channel?.stream?.isLive ?? false;
  const thumbnail = getMediaSource(channel?.stream?.thumbnailUrl ?? null);

  // ── LiveKit: viewer identity + access token ──────────────────
  // Logged-in viewers use their own user id; anonymous viewers get a stable
  // per-session id (the stream-service then mints an anonymous "Viewer").
  const { data: profileData } = useQuery<{ findProfile: MyProfile }>(
    FIND_MY_PROFILE,
    { skip: !isAuthenticated }
  );
  const anonIdRef = useRef<string>(`anon-${Math.random().toString(36).slice(2)}`);
  const viewerId = profileData?.findProfile?.id ?? anonIdRef.current;

  const [generateToken] = useMutation(GENERATE_STREAM_TOKEN);
  const [lkToken, setLkToken] = useState<string | null>(null);

  useEffect(() => {
    if (!isLive || !channelId) { setLkToken(null); return; }
    // Wait for the profile to resolve before minting, so we don't request an
    // anonymous token and immediately replace it with the logged-in one.
    if (isAuthenticated && !profileData) return;

    let cancelled = false;
    generateToken({ variables: { data: { userId: viewerId, channelId } } })
      .then(res => { if (!cancelled) setLkToken(res.data?.generateStreamToken?.token ?? null); })
      .catch(() => { if (!cancelled) setLkToken(null); });
    return () => { cancelled = true; };
  }, [isLive, channelId, isAuthenticated, profileData, viewerId, generateToken]);

  // Configure the native audio session for the lifetime of this screen.
  useEffect(() => {
    let active = false;
    AudioSession.startAudioSession().then(() => { active = true; }).catch(() => {});
    return () => { if (active) AudioSession.stopAudioSession(); };
  }, []);

  const { data: followingsData, loading: loadingFollowings, refetch: refetchFollowings } = useQuery<{
    findMyFollowings: FollowItem[];
  }>(FIND_MY_FOLLOWINGS, { skip: !isAuthenticated });

  const isFollowing = followingsData?.findMyFollowings.some(
    f => f.following.id === channel?.id
  ) ?? false;

  const { data: chatData } = useQuery<{ findChatMessagesByStream: ChatMessage[] }>(
    FIND_CHAT_MESSAGES,
    { variables: { streamId }, skip: !streamId }
  );

  useEffect(() => {
    if (chatData?.findChatMessagesByStream) setMessages(chatData.findChatMessagesByStream);
  }, [chatData]);

  useSubscription<{ chatMessageAdded: ChatMessage }>(CHAT_MESSAGE_ADDED, {
    variables: { streamId },
    skip: !streamId,
    onData: ({ data }) => {
      const msg = data.data?.chatMessageAdded;
      if (msg) {
        setMessages(prev => [...prev, msg]);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
      }
    },
  });

  const [sendMessage, { loading: sending }] = useMutation(SEND_CHAT_MESSAGE);
  const onSend = async () => {
    if (!text.trim() || !streamId) return;
    const msg = text.trim();
    setText('');
    await sendMessage({ variables: { data: { streamId, text: msg } } });
  };

  const [follow,   { loading: followLoading   }] = useMutation(FOLLOW_CHANNEL,   { onCompleted: () => refetchFollowings(), onError: () => refetchFollowings() });
  const [unfollow, { loading: unfollowLoading }] = useMutation(UNFOLLOW_CHANNEL, { onCompleted: () => refetchFollowings(), onError: () => refetchFollowings() });

  const onFollow = () => {
    if (!channel || loadingFollowings) return;
    isFollowing
      ? unfollow({ variables: { channelId: channel.id } })
      : follow({ variables: { channelId: channel.id } });
  };

  const chatEnabled = channel?.stream?.isChatEnabled ?? false;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <VideoArea isLive={isLive} thumbnail={thumbnail} onBack={() => router.back()}>
        {isLive && lkToken ? (
          <LiveKitRoom
            serverUrl={LIVEKIT_WS_URL}
            token={lkToken}
            connect
            audio={false}
            video={false}
          >
            <LiveStage />
          </LiveKitRoom>
        ) : undefined}
      </VideoArea>

      {loadingChannel ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.accent} />
        </View>
      ) : channel ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <StreamInfo
            channel={channel}
            isFollowing={isFollowing}
            onFollow={onFollow}
            followLoading={followLoading || unfollowLoading || loadingFollowings}
          />

          <ChannelVideos channelId={channel.id} />

          {chatEnabled ? (
            <>
              <ChatHeader count={messages.length} />

              <FlatList
                ref={listRef}
                data={messages}
                keyExtractor={m => m.id}
                contentContainerStyle={styles.chatList}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => <ChatMsg msg={item} />}
                ListEmptyComponent={
                  <Text style={styles.chatEmpty}>
                    {isLive ? 'Be the first to chat!' : 'Chat unavailable while offline'}
                  </Text>
                }
              />

              {isAuthenticated && isLive && (
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    value={text}
                    onChangeText={setText}
                    placeholder="Send a message…"
                    placeholderTextColor={COLORS.textMuted}
                    onSubmitEditing={onSend}
                    returnKeyType="send"
                    maxLength={200}
                  />
                  <TouchableOpacity
                    style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
                    onPress={onSend}
                    disabled={!text.trim() || sending}
                    activeOpacity={0.8}
                  >
                    {sending
                      ? <ActivityIndicator size="small" color="#000" />
                      : <IconSend size={17} color="#000" />
                    }
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <View style={styles.center}>
              <Text style={styles.chatDisabledText}>Chat is disabled for this stream</Text>
            </View>
          )}
        </KeyboardAvoidingView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: COLORS.bg },
  flex:  { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // ── Video
  video: {
    width: SCREEN_WIDTH,
    height: VIDEO_HEIGHT,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  backBtn: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  videoCenter: { alignItems: 'center', gap: 8 },
  videoConnecting: { alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#000' },
  videoLabel:  { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 },

  // ── Quality selector
  qualityWrap: { position: 'absolute', bottom: 12, right: 12, alignItems: 'flex-end', gap: 6 },
  qualityBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  qualityBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  qualityMenu: {
    backgroundColor: 'rgba(0,0,0,0.88)', borderRadius: 8,
    paddingVertical: 4, minWidth: 96,
    borderWidth: 1, borderColor: COLORS.border,
  },
  qualityItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 8, gap: 10,
  },
  qualityItemText: { color: '#fff', fontSize: 13 },
  qualityItemTextActive: { color: COLORS.accent, fontWeight: '700' },

  // ── Playback controls (play/pause, mute, volume)
  playback: {
    position: 'absolute', bottom: 12, left: 12,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  ctrlBtn: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  sliderHit: { width: SLIDER_W, height: 24, justifyContent: 'center' },
  sliderTrack: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)' },
  sliderFill: { position: 'absolute', left: 0, top: 0, height: 4, borderRadius: 2, backgroundColor: '#fff' },
  sliderThumb: { position: 'absolute', top: -4, width: 12, height: 12, borderRadius: 6, backgroundColor: '#fff' },
  pausedScrim: { backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  bigPlay: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  liveBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.live,
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  liveDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveText: { fontSize: 11, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },

  // ── Stream info
  info: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 8,
    backgroundColor: COLORS.bg,
  },
  infoRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarWrap:  { position: 'relative' },
  avatar:      { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 },
  avatarFallback: { backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center' },
  avatarInitial:  { fontSize: 18, fontWeight: '700', color: COLORS.accent },
  liveRing: {
    position: 'absolute', top: -2, left: -2,
    width: AVATAR_SIZE + 4, height: AVATAR_SIZE + 4,
    borderRadius: (AVATAR_SIZE + 4) / 2,
    borderWidth: 2, borderColor: COLORS.live,
  },
  infoMeta:  { flex: 1 },
  nameRow:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  displayName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  categoryTag: {
    marginTop: 3,
    alignSelf: 'flex-start',
    fontSize: 11, fontWeight: '600', color: COLORS.accent,
    backgroundColor: 'rgba(24,185,174,0.12)',
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4,
  },
  streamTitle: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19 },

  followBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: COLORS.accent,
    minWidth: 82, alignItems: 'center',
  },
  followBtnActive: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: COLORS.border },
  followBtnText:       { color: '#000', fontSize: 13, fontWeight: '700' },
  followBtnTextActive: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '600' },

  // ── Chat header
  chatHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 9,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  chatHeaderLeft:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chatHeaderText:  { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  chatHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chatCount:       { fontSize: 12, color: COLORS.textMuted },

  // ── Chat messages
  chatList:  { paddingHorizontal: 12, paddingVertical: 10, gap: 10 },
  chatEmpty: { textAlign: 'center', color: COLORS.textMuted, fontSize: 13, paddingTop: 24 },

  msgRow: { flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  msgAvatar: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    marginTop: 1,
  },
  msgAvatarImg:     { width: 28, height: 28, borderRadius: 14 },
  msgAvatarInitial: { fontSize: 12, fontWeight: '700', color: '#fff' },
  msgBubble:  { flex: 1 },
  msgUser:    { fontSize: 12, fontWeight: '700', marginBottom: 2 },
  msgText:    { fontSize: 13, color: COLORS.textPrimary, lineHeight: 18 },

  // ── Input
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: COLORS.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.35 },
  chatDisabledText: { color: COLORS.textMuted, fontSize: 13 },

  // ── Channel videos (VOD)
  vodSection: {
    paddingTop: 12, paddingBottom: 6,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  vodSectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, marginBottom: 10,
  },
  vodSectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  vodList: { paddingHorizontal: 14, gap: 10 },
  vodCard: { width: 150 },
  vodThumb: {
    width: 150, height: 84, borderRadius: 8, overflow: 'hidden',
    backgroundColor: COLORS.card,
  },
  vodThumbFallback: { alignItems: 'center', justifyContent: 'center' },
  vodPlayBadge: {
    position: 'absolute', top: '50%', left: '50%',
    width: 32, height: 32, borderRadius: 16, marginLeft: -16, marginTop: -16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  vodDuration: {
    position: 'absolute', bottom: 5, right: 5,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 4,
    paddingHorizontal: 5, paddingVertical: 2,
  },
  vodDurationText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  vodCardTitle: { marginTop: 6, fontSize: 12, color: COLORS.textPrimary, lineHeight: 16 },

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
});
