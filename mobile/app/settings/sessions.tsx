import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { IconDeviceMobile, IconDeviceLaptop, IconTrash, IconMapPin, IconWifi } from '@tabler/icons-react-native';
import { COLORS } from '@/src/libs/constants/colors';
import { SettingsHeader } from '@/src/components/settings/SettingsHeader';
import {
  FIND_SESSIONS,
  FIND_CURRENT_SESSION,
  REMOVE_SESSION,
  type SessionItem,
} from '@/src/graphql/queries/settings.queries';

function deviceIcon(type: string) {
  return type.toLowerCase().includes('mobile') ? IconDeviceMobile : IconDeviceLaptop;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return iso; }
}

function SessionCard({
  session,
  isCurrent,
  onRemove,
  removing,
}: {
  session: SessionItem;
  isCurrent: boolean;
  onRemove: () => void;
  removing: boolean;
}) {
  const DeviceIcon = deviceIcon(session.metadata.device.type);
  return (
    <View style={[styles.card, isCurrent && styles.cardCurrent]}>
      <View style={styles.cardLeft}>
        <View style={[styles.deviceIcon, isCurrent && styles.deviceIconCurrent]}>
          <DeviceIcon size={18} color={isCurrent ? COLORS.accent : COLORS.textSecondary} />
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardBrowser}>{session.metadata.device.browser}</Text>
            {isCurrent && <View style={styles.currentPill}><Text style={styles.currentPillText}>This device</Text></View>}
          </View>
          <Text style={styles.cardOs}>{session.metadata.device.os} · {session.metadata.device.type}</Text>
          <View style={styles.cardMeta}>
            <IconMapPin size={11} color={COLORS.textMuted} />
            <Text style={styles.cardMetaText}>
              {session.metadata.location.city}, {session.metadata.location.country}
            </Text>
            <IconWifi size={11} color={COLORS.textMuted} />
            <Text style={styles.cardMetaText}>{session.metadata.ip}</Text>
          </View>
          <Text style={styles.cardDate}>{formatDate(session.createdAt)}</Text>
        </View>
      </View>

      {!isCurrent && (
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={onRemove}
          disabled={removing}
          activeOpacity={0.7}
          hitSlop={8}
        >
          {removing
            ? <ActivityIndicator size="small" color={COLORS.danger} />
            : <IconTrash size={16} color={COLORS.danger} />
          }
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function SessionsScreen() {
  const { data: sessionsData, loading, refetch } = useQuery<{ findSessionByUser: SessionItem[] }>(FIND_SESSIONS);
  const { data: currentData } = useQuery<{ findCurrentSession: SessionItem }>(FIND_CURRENT_SESSION);

  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removeSession] = useMutation(REMOVE_SESSION, {
    onCompleted: () => { setRemovingId(null); refetch(); },
    onError: (e) => { setRemovingId(null); Alert.alert('Error', e.message); },
  });

  function onRemove(id: string) {
    Alert.alert('Remove session', 'This will sign out that device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => {
        setRemovingId(id);
        removeSession({ variables: { id } });
      }},
    ]);
  }

  const sessions  = sessionsData?.findSessionByUser ?? [];
  const currentId = currentData?.findCurrentSession?.id;

  // Sort current session first
  const sorted = [...sessions].sort((a, b) => (a.id === currentId ? -1 : b.id === currentId ? 1 : 0));

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <SettingsHeader title="Sessions" />
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.accent} /></View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={s => s.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <SessionCard
              session={item}
              isCurrent={item.id === currentId}
              onRemove={() => onRemove(item.id)}
              removing={removingId === item.id}
            />
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No sessions found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:   { padding: 16, gap: 10 },
  emptyText: { color: COLORS.textMuted, fontSize: 14 },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.card, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.border,
    padding: 14, gap: 12,
  },
  cardCurrent: { borderColor: COLORS.accent + '44' },
  cardLeft: { flex: 1, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  deviceIcon: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: COLORS.bg,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  deviceIconCurrent: { backgroundColor: 'rgba(24,185,174,0.1)' },
  cardInfo:    { flex: 1, gap: 3 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardBrowser:  { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  currentPill: {
    backgroundColor: 'rgba(24,185,174,0.15)',
    borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
  },
  currentPillText: { fontSize: 10, fontWeight: '700', color: COLORS.accent },
  cardOs:   { fontSize: 12, color: COLORS.textSecondary },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  cardMetaText: { fontSize: 11, color: COLORS.textMuted },
  cardDate: { fontSize: 11, color: COLORS.textDisabled, marginTop: 2 },

  removeBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: 'rgba(229,62,62,0.1)',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
});
