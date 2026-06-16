import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { memo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useQuery } from '@apollo/client';
import {
  IconArrowLeft,
  IconBell,
  IconUser,
  IconMedal,
  IconRadio,
  IconFingerprint,
  IconCircleCheck,
} from '@tabler/icons-react-native';
import { useColors, useThemedStyles } from '@/src/libs/theme/use-theme';
import type { Palette } from '@/src/libs/theme/palettes';
import {
  FIND_NOTIFICATIONS,
  NotificationType,
  type NotificationItem,
} from '@/src/graphql/queries/notifications.queries';

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case NotificationType.NEW_FOLLOWER:      return IconUser;
    case NotificationType.STREAM_START:      return IconRadio;
    case NotificationType.NEW_SPONSORSHIP:   return IconMedal;
    case NotificationType.ENABLE_TWO_FACTOR: return IconFingerprint;
    case NotificationType.VERIFIED_CHANNEL:  return IconCircleCheck;
    default:                                  return IconBell;
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

function timeAgo(isoDate: string, t: TFunction): string {
  const diff = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (diff < 60)        return t('notifications.time.seconds', { n: diff });
  if (diff < 3600)      return t('notifications.time.minutes', { n: Math.floor(diff / 60) });
  if (diff < 86400)     return t('notifications.time.hours', { n: Math.floor(diff / 3600) });
  return t('notifications.time.days', { n: Math.floor(diff / 86400) });
}

const NotificationRow = memo(function NotificationRow({ item }: { item: NotificationItem }) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  const Icon = getNotificationIcon(item.type);
  return (
    <View style={[styles.row, !item.isRead && styles.rowUnread]}>
      <View style={styles.iconWrap}>
        <Icon size={20} color={c.accent} strokeWidth={1.8} />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.message}>{stripHtml(item.message)}</Text>
        <Text style={styles.time}>{timeAgo(item.createdAt, t)}</Text>
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </View>
  );
});

export default function NotificationsScreen() {
  const router = useRouter();
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();

  const { data, loading, error, refetch } = useQuery<{
    findNotificationByUser: NotificationItem[];
  }>(FIND_NOTIFICATIONS);

  const notifications = data?.findNotificationByUser ?? [];

  return (
    <>
    <View style={[StyleSheet.absoluteFill, { backgroundColor: c.bg }]} />
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <IconArrowLeft size={22} color={c.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('notifications.title')}</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={c.accent} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error.message}</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.center}>
          <IconBell size={48} color={c.textMuted} strokeWidth={1.2} />
          <Text style={styles.emptyText}>{t('notifications.empty')}</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <NotificationRow item={item} />}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
    </>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  backBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: c.card,
  },
  title: { fontSize: 17, fontWeight: '700', color: c.textPrimary },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { color: c.danger, fontSize: 14, textAlign: 'center', paddingHorizontal: 24 },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: c.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: c.border,
  },
  retryText: { color: c.textPrimary, fontSize: 14 },
  emptyText: { color: c.textMuted, fontSize: 15, marginTop: 8 },

  list: { paddingVertical: 8 },
  separator: { height: 1, backgroundColor: c.border, marginHorizontal: 16 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowUnread: { backgroundColor: 'rgba(24,185,174,0.05)' },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(24,185,174,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowContent: { flex: 1 },
  message: { fontSize: 14, color: c.textPrimary, lineHeight: 20 },
  time: { fontSize: 12, color: c.textMuted, marginTop: 3 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: c.accent,
    flexShrink: 0,
  },
});
