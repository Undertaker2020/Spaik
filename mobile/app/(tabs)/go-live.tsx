import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  StyleSheet,
  ActivityIndicator,
  Modal,
  FlatList,
  Clipboard,
  Alert,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from '@apollo/client';
import {
  LiveKitRoom,
  VideoTrack,
  useTracks,
  useLocalParticipant,
  isTrackReference,
  AudioSession,
} from '@livekit/react-native';
import { Track, VideoPresets43 } from 'livekit-client';
import {
  IconVideo,
  IconKey,
  IconServer,
  IconCopy,
  IconCheck,
  IconRefresh,
  IconChevronDown,
  IconMessageCircle,
  IconUsers,
  IconCrown,
  IconMicrophone,
  IconMicrophoneOff,
  IconPlayerStopFilled,
} from '@tabler/icons-react-native';
import { COLORS } from '@/src/libs/constants/colors';
import { LIVEKIT_WS_URL } from '@/src/libs/constants/url.constants';
import {
  FIND_MY_STREAM,
  FIND_ALL_CATEGORIES,
  CHANGE_STREAM_INFO,
  CHANGE_CHAT_SETTINGS,
  CREATE_INGRESS,
  GENERATE_STREAM_TOKEN,
  type StreamSettings,
  type CategoryOption,
} from '@/src/graphql/queries/stream.queries';

// ── Copy button ───────────────────────────────────────────────

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = () => {
    Clipboard.setString(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <TouchableOpacity onPress={onCopy} style={styles.copyBtn} activeOpacity={0.7}>
      {copied
        ? <IconCheck size={16} color={COLORS.accent} />
        : <IconCopy size={16} color={COLORS.textSecondary} />
      }
    </TouchableOpacity>
  );
}

// ── Key field ─────────────────────────────────────────────────

function KeyField({ label, value, icon: Icon }: {
  label: string;
  value: string | null;
  icon: React.ComponentType<{ size: number; color: string }>;
}) {
  const [visible, setVisible] = useState(false);
  const display = value ?? '—';
  const masked = value ? '•'.repeat(Math.min(value.length, 24)) : '—';

  return (
    <View style={styles.keyField}>
      <View style={styles.keyFieldHeader}>
        <Icon size={14} color={COLORS.textSecondary} />
        <Text style={styles.keyFieldLabel}>{label}</Text>
      </View>
      <View style={styles.keyFieldRow}>
        <Text style={styles.keyFieldValue} numberOfLines={1} selectable>
          {visible ? display : masked}
        </Text>
        <TouchableOpacity onPress={() => setVisible(v => !v)} style={styles.copyBtn} activeOpacity={0.7}>
          <Text style={styles.toggleText}>{visible ? 'Hide' : 'Show'}</Text>
        </TouchableOpacity>
        {value && <CopyButton value={value} />}
      </View>
    </View>
  );
}

// ── Category picker modal ─────────────────────────────────────

function CategoryPicker({ categories, selectedId, onSelect }: {
  categories: CategoryOption[];
  selectedId: string;
  onSelect: (id: string, title: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = categories.find(c => c.id === selectedId);

  return (
    <>
      <TouchableOpacity style={styles.picker} onPress={() => setOpen(true)} activeOpacity={0.8}>
        <Text style={[styles.pickerText, !selected && styles.pickerPlaceholder]}>
          {selected?.title ?? 'Select category'}
        </Text>
        <IconChevronDown size={16} color={COLORS.textSecondary} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setOpen(false)} activeOpacity={1}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Category</Text>
            <FlatList
              data={categories}
              keyExtractor={c => c.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, item.id === selectedId && styles.modalItemActive]}
                  onPress={() => { onSelect(item.id, item.title); setOpen(false); }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.modalItemText, item.id === selectedId && styles.modalItemTextActive]}>
                    {item.title}
                  </Text>
                  {item.id === selectedId && <IconCheck size={16} color={COLORS.accent} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

// ── Broadcast view (inside LiveKitRoom; publishes local camera) ─

function BroadcastView({ onEnd, aspect }: { onEnd: () => void; aspect: '16:9' | '4:3' }) {
  const tracks = useTracks([Track.Source.Camera]);
  const localCam = tracks.find(t => isTrackReference(t) && t.participant.isLocal);
  const { localParticipant } = useLocalParticipant();
  const [micOn, setMicOn] = useState(true);

  const toggleMic = async () => {
    const next = !micOn;
    await localParticipant.setMicrophoneEnabled(next);
    setMicOn(next);
  };

  return (
    <View style={[styles.broadcastStage, { aspectRatio: aspect === '4:3' ? 4 / 3 : 16 / 9 }]}>
      {localCam ? (
        <VideoTrack trackRef={localCam} style={StyleSheet.absoluteFillObject} objectFit="contain" mirror />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.broadcastConnecting]}>
          <ActivityIndicator color="#fff" />
          <Text style={styles.cameraNote}>Starting camera…</Text>
        </View>
      )}

      <View style={styles.liveBadgeAbs}>
        <View style={styles.liveBadgeDot} />
        <Text style={styles.liveBadgeText}>LIVE</Text>
      </View>

      <View style={styles.broadcastControls}>
        <TouchableOpacity onPress={toggleMic} style={styles.ctrlBtn} activeOpacity={0.8}>
          {micOn
            ? <IconMicrophone size={20} color="#fff" />
            : <IconMicrophoneOff size={20} color={COLORS.live} />}
        </TouchableOpacity>
        <TouchableOpacity onPress={onEnd} style={styles.endBtn} activeOpacity={0.85}>
          <IconPlayerStopFilled size={16} color="#fff" />
          <Text style={styles.endBtnText}>End Stream</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────

export default function GoLiveScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isChatEnabled, setIsChatEnabled] = useState(true);
  const [isChatFollowersOnly, setIsChatFollowersOnly] = useState(false);
  const [isChatPremiumFollowersOnly, setIsChatPremiumFollowersOnly] = useState(false);
  const [saved, setSaved] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [hostToken, setHostToken] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [aspect, setAspect] = useState<'16:9' | '4:3'>('16:9');

  const { data: profileData, loading: loadingProfile, refetch } = useQuery<{
    findProfile: { id: string; stream: StreamSettings };
  }>(FIND_MY_STREAM, { fetchPolicy: 'cache-and-network' });

  const { data: categoriesData } = useQuery<{ findAllCategories: CategoryOption[] }>(
    FIND_ALL_CATEGORIES
  );

  const stream = profileData?.findProfile.stream;
  const userId = profileData?.findProfile.id;
  const categories = categoriesData?.findAllCategories ?? [];

  useEffect(() => {
    if (!stream) return;
    setTitle(stream.title ?? '');
    setCategoryId(stream.category?.id ?? '');
    setIsChatEnabled(stream.isChatEnabled);
    setIsChatFollowersOnly(stream.isChatFollowersOnly);
    setIsChatPremiumFollowersOnly(stream.isChatPremiumFollowersOnly);
  }, [stream]);

  const [changeInfo, { loading: savingInfo }] = useMutation(CHANGE_STREAM_INFO);
  const [changeChatSettings, { loading: savingChat }] = useMutation(CHANGE_CHAT_SETTINGS);
  const [createIngress, { loading: generatingIngress }] = useMutation(CREATE_INGRESS);
  const [generateToken] = useMutation(GENERATE_STREAM_TOKEN);

  const saving = savingInfo || savingChat;

  // Audio session is only needed while actively broadcasting.
  useEffect(() => {
    if (!broadcasting) return;
    let active = false;
    AudioSession.startAudioSession().then(() => { active = true; }).catch(() => {});
    return () => { if (active) AudioSession.stopAudioSession(); };
  }, [broadcasting]);

  const startBroadcast = async () => {
    if (!userId) return;
    if (!categoryId) {
      Alert.alert('Add a category', 'Select a category before going live.');
      return;
    }

    setStarting(true);
    try {
      // Camera + mic permissions (Android; iOS prompts on first use via Info.plist).
      if (Platform.OS === 'android') {
        const res = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);
        const granted =
          res['android.permission.CAMERA'] === 'granted' &&
          res['android.permission.RECORD_AUDIO'] === 'granted';
        if (!granted) {
          Alert.alert('Permissions required', 'Camera and microphone access are needed to go live.');
          return;
        }
      }

      // Persist title/category/chat so viewers see the right metadata.
      await Promise.all([
        changeInfo({ variables: { data: { title, categoryId } } }),
        changeChatSettings({ variables: { data: { isChatEnabled, isChatFollowersOnly, isChatPremiumFollowersOnly } } }),
      ]);

      // Host token: asHost → publish grant + bare channel identity. Room = own id.
      const tokenRes = await generateToken({ variables: { data: { userId, channelId: userId, asHost: true } } });
      const token = tokenRes.data?.generateStreamToken?.token;
      if (!token) {
        Alert.alert('Error', 'Could not start the stream. Try again.');
        return;
      }
      setHostToken(token);
      setBroadcasting(true);
    } catch {
      Alert.alert('Error', 'Could not start the stream. Try again.');
    } finally {
      setStarting(false);
    }
  };

  const endBroadcast = () => {
    setBroadcasting(false);
    setHostToken(null);
    // Give the LiveKit `participant_left` webhook a moment to flip isLive.
    setTimeout(() => refetch(), 1500);
  };

  const onSave = async () => {
    if (!categoryId) return;
    await Promise.all([
      changeInfo({ variables: { data: { title, categoryId } } }),
      changeChatSettings({ variables: { data: { isChatEnabled, isChatFollowersOnly, isChatPremiumFollowersOnly } } }),
    ]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    refetch();
  };

  const onCreateIngress = () => {
    Alert.alert(
      'Create WHIP Ingress',
      'This will reset your current stream key and server URL. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          style: 'destructive',
          onPress: async () => {
            await createIngress({ variables: { ingressType: 1 } });
            refetch();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Go Live</Text>
        <View style={styles.headerRight}>
          {stream?.isLive && (
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.dashBtn}
            onPress={() => router.push('/dashboard' as any)}
            activeOpacity={0.75}
          >
            <Text style={styles.dashBtnText}>Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loadingProfile && !stream ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Camera broadcast */}
          {broadcasting && hostToken ? (
            // Capture preset follows the chosen aspect so the camera frame is
            // published at that ratio (no cropping); players letterbox it.
            <LiveKitRoom
              serverUrl={LIVEKIT_WS_URL}
              token={hostToken}
              connect
              audio
              video={aspect === '4:3' ? { resolution: VideoPresets43.h720.resolution } : true}
            >
              <BroadcastView onEnd={endBroadcast} aspect={aspect} />
            </LiveKitRoom>
          ) : (
            <View style={styles.cameraPlaceholder}>
              <IconVideo size={36} color={COLORS.textMuted} />
              <Text style={styles.cameraNote}>Broadcast live from your phone</Text>

              <View style={styles.aspectRow}>
                {(['16:9', '4:3'] as const).map(a => (
                  <TouchableOpacity
                    key={a}
                    onPress={() => setAspect(a)}
                    style={[styles.aspectBtn, aspect === a && styles.aspectBtnActive]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.aspectBtnText, aspect === a && styles.aspectBtnTextActive]}>{a}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.goLiveBtn, (starting || !categoryId) && styles.saveBtnDisabled]}
                onPress={startBroadcast}
                disabled={starting || !categoryId}
                activeOpacity={0.85}
              >
                {starting
                  ? <ActivityIndicator size="small" color="#000" />
                  : <Text style={styles.goLiveBtnText}>Go Live</Text>}
              </TouchableOpacity>
              <Text style={styles.cameraNoteSub}>or use the stream keys below with OBS</Text>
            </View>
          )}

          {/* Stream Info */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Stream Info</Text>

            <Text style={styles.fieldLabel}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Add a title for your stream..."
              placeholderTextColor={COLORS.textMuted}
              maxLength={100}
            />

            <Text style={styles.fieldLabel}>Category</Text>
            <CategoryPicker
              categories={categories}
              selectedId={categoryId}
              onSelect={(id) => setCategoryId(id)}
            />
          </View>

          {/* Chat settings */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Chat Settings</Text>

            <View style={styles.toggle}>
              <View style={styles.toggleLeft}>
                <IconMessageCircle size={16} color={COLORS.textSecondary} />
                <Text style={styles.toggleLabel}>Enable chat</Text>
              </View>
              <Switch
                value={isChatEnabled}
                onValueChange={setIsChatEnabled}
                trackColor={{ false: COLORS.card, true: COLORS.accent }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.toggle}>
              <View style={styles.toggleLeft}>
                <IconUsers size={16} color={COLORS.textSecondary} />
                <Text style={styles.toggleLabel}>Followers only</Text>
              </View>
              <Switch
                value={isChatFollowersOnly}
                onValueChange={setIsChatFollowersOnly}
                trackColor={{ false: COLORS.card, true: COLORS.accent }}
                thumbColor="#fff"
                disabled={!isChatEnabled}
              />
            </View>

            <View style={styles.toggle}>
              <View style={styles.toggleLeft}>
                <IconCrown size={16} color={COLORS.textSecondary} />
                <Text style={styles.toggleLabel}>Subscribers only</Text>
              </View>
              <Switch
                value={isChatPremiumFollowersOnly}
                onValueChange={setIsChatPremiumFollowersOnly}
                trackColor={{ false: COLORS.card, true: COLORS.accent }}
                thumbColor="#fff"
                disabled={!isChatEnabled}
              />
            </View>
          </View>

          {/* Stream Keys */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>Stream Keys</Text>
              <TouchableOpacity
                onPress={onCreateIngress}
                style={styles.refreshBtn}
                disabled={generatingIngress}
                activeOpacity={0.75}
              >
                {generatingIngress
                  ? <ActivityIndicator size="small" color={COLORS.accent} />
                  : <IconRefresh size={16} color={COLORS.accent} />
                }
                <Text style={styles.refreshBtnText}>New Ingress</Text>
              </TouchableOpacity>
            </View>

            <KeyField label="Server URL" value={stream?.serverUrl ?? null} icon={IconServer} />
            <KeyField label="Stream Key" value={stream?.streamKey ?? null} icon={IconKey} />

            {!stream?.serverUrl && (
              <TouchableOpacity style={styles.createIngressBtn} onPress={onCreateIngress} activeOpacity={0.85}>
                <Text style={styles.createIngressBtnText}>Create WHIP Ingress</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Save button */}
          <TouchableOpacity
            style={[styles.saveBtn, (saving || !categoryId) && styles.saveBtnDisabled]}
            onPress={onSave}
            disabled={saving || !categoryId}
            activeOpacity={0.85}
          >
            {saving
              ? <ActivityIndicator size="small" color="#000" />
              : saved
              ? <><IconCheck size={18} color="#000" /><Text style={styles.saveBtnText}>Saved!</Text></>
              : <Text style={styles.saveBtnText}>Save Settings</Text>
            }
          </TouchableOpacity>

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
  },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.textPrimary },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dashBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, backgroundColor: COLORS.card,
    borderWidth: 1, borderColor: COLORS.border,
  },
  dashBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(229,62,62,0.15)',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(229,62,62,0.3)',
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.live },
  liveText: { fontSize: 12, fontWeight: '700', color: COLORS.live },

  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 16, paddingBottom: 32, gap: 16 },

  // Camera
  cameraPlaceholder: {
    height: 180,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  cameraNote: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, textAlign: 'center' },
  cameraNoteSub: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center' },
  goLiveBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 11,
    marginVertical: 4,
    minWidth: 140,
    alignItems: 'center',
  },
  goLiveBtnText: { color: '#000', fontWeight: '700', fontSize: 15 },
  aspectRow: { flexDirection: 'row', gap: 8 },
  aspectBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  aspectBtnActive: { backgroundColor: 'rgba(24,185,174,0.12)', borderColor: COLORS.accent },
  aspectBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  aspectBtnTextActive: { color: COLORS.accent },

  // Broadcast stage
  broadcastStage: {
    backgroundColor: '#000',
    borderRadius: 16,
    overflow: 'hidden',
  },
  broadcastConnecting: { alignItems: 'center', justifyContent: 'center', gap: 8 },
  liveBadgeAbs: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.live,
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  liveBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  broadcastControls: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ctrlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  endBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.live,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  endBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Card
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 12,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  // Fields
  fieldLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, marginBottom: -6 },
  input: {
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
  },

  // Picker
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pickerText: { fontSize: 14, color: COLORS.textPrimary },
  pickerPlaceholder: { color: COLORS.textMuted },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    maxHeight: '70%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalItemActive: {},
  modalItemText: { fontSize: 15, color: COLORS.textPrimary },
  modalItemTextActive: { color: COLORS.accent, fontWeight: '600' },

  // Toggle
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleLabel: { fontSize: 14, color: COLORS.textPrimary },

  // Key fields
  keyField: { gap: 6 },
  keyFieldHeader: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  keyFieldLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  keyFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  keyFieldValue: { flex: 1, fontSize: 13, color: COLORS.textPrimary, fontFamily: 'monospace' },
  toggleText: { fontSize: 12, color: COLORS.accent },
  copyBtn: { padding: 2 },

  // Refresh
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  refreshBtnText: { fontSize: 13, color: COLORS.accent, fontWeight: '600' },

  // Create ingress
  createIngressBtn: {
    backgroundColor: 'rgba(24,185,174,0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(24,185,174,0.25)',
    paddingVertical: 12,
    alignItems: 'center',
  },
  createIngressBtnText: { color: COLORS.accent, fontWeight: '600', fontSize: 14 },

  // Save
  saveBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#000', fontWeight: '700', fontSize: 16 },
});
