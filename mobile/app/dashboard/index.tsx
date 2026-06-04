import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Switch,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { LinearGradient } from 'expo-linear-gradient';
import {
  IconArrowLeft,
  IconBroadcast,
  IconMessage2,
  IconUsers,
  IconSettings,
  IconEdit,
  IconCheck,
  IconChevronDown,
  IconCrown,
  IconMessageCircle,
} from '@tabler/icons-react-native';
import { COLORS } from '@/src/libs/constants/colors';
import { useAuthStore } from '@/src/store/auth/auth.store';
import {
  FIND_MY_STREAM,
  CHANGE_STREAM_INFO,
  CHANGE_CHAT_SETTINGS,
  FIND_ALL_CATEGORIES,
  type StreamSettings,
  type CategoryOption,
} from '@/src/graphql/queries/stream.queries';
import {
  FIND_CHAT_MESSAGES,
  CHAT_MESSAGE_ADDED,
  type ChatMessage,
} from '@/src/graphql/queries/viewer.queries';

// ── Stat card ─────────────────────────────────────────────────

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>{icon}</View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ── Chat message row ──────────────────────────────────────────

function MsgRow({ msg }: { msg: ChatMessage }) {
  return (
    <View style={styles.msgRow}>
      <Text style={styles.msgUser}>{msg.user.username}</Text>
      <Text style={styles.msgText}> {msg.text}</Text>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────

export default function DashboardScreen() {
  const router = useRouter();
  const userId = useAuthStore(s => s.userId);

  const { data: profileData, loading, refetch } = useQuery<{
    findProfile: { id: string; stream: StreamSettings };
  }>(FIND_MY_STREAM, { fetchPolicy: 'cache-and-network' });

  const { data: categoriesData } = useQuery<{ findAllCategories: CategoryOption[] }>(
    FIND_ALL_CATEGORIES
  );

  const stream   = profileData?.findProfile.stream;
  const myUserId = profileData?.findProfile.id;
  const isLive   = stream?.isLive ?? false;
  const streamId = stream?.id;

  // ── Chat (only when live) ─────────────────────────────────

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const { data: chatData } = useQuery<{ findChatMessagesByStream: ChatMessage[] }>(
    FIND_CHAT_MESSAGES,
    { variables: { streamId }, skip: !streamId || !isLive }
  );

  useEffect(() => {
    if (chatData?.findChatMessagesByStream) {
      setMessages(chatData.findChatMessagesByStream.slice(-20));
    }
  }, [chatData]);

  useSubscription<{ chatMessageAdded: ChatMessage }>(CHAT_MESSAGE_ADDED, {
    variables: { streamId },
    skip: !streamId || !isLive,
    onData: ({ data }) => {
      const msg = data.data?.chatMessageAdded;
      if (msg) setMessages(prev => [...prev.slice(-19), msg]);
    },
  });

  // ── Edit stream info ──────────────────────────────────────

  const [editing, setEditing]       = useState(false);
  const [title, setTitle]           = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [catOpen, setCatOpen]       = useState(false);

  useEffect(() => {
    if (stream) {
      setTitle(stream.title ?? '');
      setCategoryId(stream.category?.id ?? '');
    }
  }, [stream]);

  const categories   = categoriesData?.findAllCategories ?? [];
  const selectedCat  = categories.find(c => c.id === categoryId);

  const [changeInfo, { loading: savingInfo }] = useMutation(CHANGE_STREAM_INFO, {
    onCompleted: () => { setEditing(false); refetch(); },
    onError: (e) => Alert.alert('Error', e.message),
  });

  // ── Chat settings ─────────────────────────────────────────

  const [chatEnabled,     setChatEnabled]     = useState(true);
  const [followersOnly,   setFollowersOnly]   = useState(false);
  const [premiumOnly,     setPremiumOnly]      = useState(false);

  useEffect(() => {
    if (stream) {
      setChatEnabled(stream.isChatEnabled);
      setFollowersOnly(stream.isChatFollowersOnly);
      setPremiumOnly(stream.isChatPremiumFollowersOnly);
    }
  }, [stream]);

  const [changeChatSettings, { loading: savingChat }] = useMutation(CHANGE_CHAT_SETTINGS, {
    onError: (e) => Alert.alert('Error', e.message),
  });

  function saveChatSetting(field: 'chat' | 'followers' | 'premium', value: boolean) {
    const next = {
      isChatEnabled:               field === 'chat'      ? value : chatEnabled,
      isChatFollowersOnly:         field === 'followers' ? value : followersOnly,
      isChatPremiumFollowersOnly:  field === 'premium'   ? value : premiumOnly,
    };
    if (field === 'chat')      setChatEnabled(value);
    if (field === 'followers') setFollowersOnly(value);
    if (field === 'premium')   setPremiumOnly(value);
    changeChatSettings({ variables: { data: next } });
  }

  if (loading && !stream) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <IconArrowLeft size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dashboard</Text>
        {isLive ? (
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Status banner ── */}
        {isLive ? (
          <LinearGradient
            colors={['rgba(229,62,62,0.15)', 'rgba(229,62,62,0.05)']}
            style={styles.banner}
          >
            <IconBroadcast size={20} color={COLORS.live} />
            <View style={styles.bannerInfo}>
              <Text style={styles.bannerTitle}>Stream is Live</Text>
              <Text style={styles.bannerSub} numberOfLines={1}>{stream?.title}</Text>
            </View>
          </LinearGradient>
        ) : (
          <View style={styles.offlineBanner}>
            <IconBroadcast size={20} color={COLORS.textMuted} />
            <Text style={styles.offlineText}>Stream is Offline</Text>
          </View>
        )}

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          <StatCard
            label="Messages"
            value={messages.length}
            icon={<IconMessage2 size={18} color={COLORS.accent} />}
          />
          <StatCard
            label="Status"
            value={isLive ? 'Live' : 'Offline'}
            icon={<IconBroadcast size={18} color={isLive ? COLORS.live : COLORS.textMuted} />}
          />
          <StatCard
            label="Category"
            value={stream?.category?.title ?? '—'}
            icon={<IconSettings size={18} color={COLORS.accent} />}
          />
        </View>

        {/* ── Stream info ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Stream Info</Text>
            <TouchableOpacity onPress={() => setEditing(e => !e)} style={styles.editBtn} activeOpacity={0.7}>
              <IconEdit size={15} color={COLORS.accent} />
              <Text style={styles.editBtnText}>{editing ? 'Cancel' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>

          {editing ? (
            <>
              <Text style={styles.fieldLabel}>Title</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Stream title…"
                placeholderTextColor={COLORS.textMuted}
                maxLength={100}
                selectionColor={COLORS.accent}
                color={COLORS.textPrimary}
              />

              <Text style={styles.fieldLabel}>Category</Text>
              <TouchableOpacity style={styles.picker} onPress={() => setCatOpen(o => !o)} activeOpacity={0.8}>
                <Text style={[styles.pickerText, !selectedCat && styles.pickerPlaceholder]}>
                  {selectedCat?.title ?? 'Select category'}
                </Text>
                <IconChevronDown size={15} color={COLORS.textSecondary} />
              </TouchableOpacity>

              {catOpen && (
                <View style={styles.catDropdown}>
                  {categories.map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.catItem, cat.id === categoryId && styles.catItemActive]}
                      onPress={() => { setCategoryId(cat.id); setCatOpen(false); }}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.catItemText, cat.id === categoryId && styles.catItemTextActive]}>
                        {cat.title}
                      </Text>
                      {cat.id === categoryId && <IconCheck size={14} color={COLORS.accent} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={[styles.saveBtn, (!title.trim() || !categoryId || savingInfo) && styles.saveBtnDisabled]}
                onPress={() => changeInfo({ variables: { data: { title: title.trim(), categoryId } } })}
                disabled={!title.trim() || !categoryId || savingInfo}
                activeOpacity={0.85}
              >
                {savingInfo
                  ? <ActivityIndicator size="small" color="#000" />
                  : <Text style={styles.saveBtnText}>Save Changes</Text>
                }
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.infoRows}>
              <InfoRow label="Title"    value={stream?.title ?? '—'} />
              <InfoRow label="Category" value={stream?.category?.title ?? '—'} />
            </View>
          )}
        </View>

        {/* ── Chat settings ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Chat Settings</Text>

          <ToggleRow
            icon={<IconMessageCircle size={16} color={COLORS.textSecondary} />}
            label="Enable chat"
            value={chatEnabled}
            onChange={v => saveChatSetting('chat', v)}
            loading={savingChat}
          />
          <ToggleRow
            icon={<IconUsers size={16} color={COLORS.textSecondary} />}
            label="Followers only"
            value={followersOnly}
            onChange={v => saveChatSetting('followers', v)}
            disabled={!chatEnabled}
            loading={savingChat}
          />
          <ToggleRow
            icon={<IconCrown size={16} color={COLORS.textSecondary} />}
            label="Sponsors only"
            value={premiumOnly}
            onChange={v => saveChatSetting('premium', v)}
            disabled={!chatEnabled}
            loading={savingChat}
          />
        </View>

        {/* ── Live chat feed ── */}
        {isLive && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Live Chat</Text>
              <View style={styles.chatCountBadge}>
                <Text style={styles.chatCountText}>{messages.length}</Text>
              </View>
            </View>

            {messages.length === 0 ? (
              <Text style={styles.emptyChat}>No messages yet</Text>
            ) : (
              <FlatList
                data={[...messages].reverse()}
                keyExtractor={m => m.id}
                scrollEnabled={false}
                renderItem={({ item }) => <MsgRow msg={item} />}
                ItemSeparatorComponent={() => <View style={styles.msgSep} />}
              />
            )}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Small helpers ─────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

function ToggleRow({ icon, label, value, onChange, disabled, loading }: {
  icon: React.ReactNode;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <View style={[styles.toggleRow, disabled && styles.toggleRowDisabled]}>
      <View style={styles.toggleLeft}>
        {icon}
        <Text style={styles.toggleLabel}>{label}</Text>
      </View>
      {loading
        ? <ActivityIndicator size="small" color={COLORS.accent} />
        : (
          <Switch
            value={value}
            onValueChange={onChange}
            disabled={disabled || loading}
            trackColor={{ false: COLORS.border, true: COLORS.accent }}
            thumbColor="#fff"
            ios_backgroundColor={COLORS.border}
          />
        )
      }
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, gap: 14, paddingBottom: 32 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  livePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(229,62,62,0.15)', borderRadius: 99,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(229,62,62,0.3)',
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.live },
  liveText: { fontSize: 12, fontWeight: '700', color: COLORS.live },

  // Banner
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(229,62,62,0.2)',
  },
  bannerInfo: { flex: 1 },
  bannerTitle: { fontSize: 14, fontWeight: '700', color: COLORS.live },
  bannerSub:   { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  offlineBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  offlineText: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, backgroundColor: COLORS.card, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.border,
    padding: 12, alignItems: 'center', gap: 4,
  },
  statIcon:  { marginBottom: 2 },
  statValue: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  statLabel: { fontSize: 10, color: COLORS.textSecondary, textAlign: 'center' },

  // Card
  card: {
    backgroundColor: COLORS.card, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.border,
    padding: 14, gap: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle:  { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editBtnText: { fontSize: 13, color: COLORS.accent, fontWeight: '600' },

  // Info rows
  infoRows: { gap: 8 },
  infoRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  infoLabel: { fontSize: 13, color: COLORS.textSecondary, width: 70 },
  infoValue: { flex: 1, fontSize: 13, color: COLORS.textPrimary, fontWeight: '500' },

  // Fields
  fieldLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: COLORS.bg, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14,
  },
  picker: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.bg, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  pickerText:        { fontSize: 14, color: COLORS.textPrimary },
  pickerPlaceholder: { color: COLORS.textMuted },

  catDropdown: {
    backgroundColor: COLORS.bg, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  catItem: { paddingHorizontal: 14, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  catItemActive: { backgroundColor: 'rgba(24,185,174,0.08)' },
  catItemText:       { fontSize: 14, color: COLORS.textPrimary },
  catItemTextActive: { color: COLORS.accent, fontWeight: '600' },

  saveBtn: {
    backgroundColor: COLORS.accent, borderRadius: 12,
    paddingVertical: 13, alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: '#000', fontWeight: '700', fontSize: 14 },

  // Toggles
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleRowDisabled: { opacity: 0.4 },
  toggleLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleLabel: { fontSize: 14, color: COLORS.textPrimary },

  // Chat
  chatCountBadge: {
    backgroundColor: COLORS.bg, borderRadius: 99,
    paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1, borderColor: COLORS.border,
  },
  chatCountText: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
  emptyChat: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', paddingVertical: 8 },
  msgRow: { flexDirection: 'row', flexWrap: 'wrap' },
  msgUser: { fontSize: 13, fontWeight: '700', color: COLORS.accent },
  msgText: { fontSize: 13, color: COLORS.textPrimary },
  msgSep:  { height: 6 },
});
