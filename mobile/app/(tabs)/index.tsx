import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@apollo/client';
import { LinearGradient } from 'expo-linear-gradient';
import { IconBell, IconSearch } from '@tabler/icons-react-native';
import {
  FIND_NOTIFICATION_UNREAD_COUNT,
} from '@/src/graphql/queries/notifications.queries';
import { useColors, useThemedStyles } from '@/src/libs/theme/use-theme';
import type { Palette } from '@/src/libs/theme/palettes';
import { CategoryPill } from '@/src/components/ui/CategoryPill';
import { Avatar } from '@/src/components/ui/Avatar';
import { LiveBadge } from '@/src/components/ui/LiveBadge';
import { getMediaSource } from '@/src/libs/utils/get-media-source';
import {
  FIND_RANDOM_STREAMS,
  FIND_RANDOM_CATEGORIES,
  type StreamItem,
  type CategoryItem,
} from '@/src/graphql/queries/home.queries';

const { width: W } = Dimensions.get('window');
const H_PAD          = 16;
const FEATURED_H     = 220;
const REC_W          = 160;
const REC_H          = REC_W * (9 / 16);
const CAT_W          = 110;
const CAT_H          = 70;

// ── Featured card ─────────────────────────────────────────────

function FeaturedCard({ stream, onPress }: { stream: StreamItem; onPress: () => void }) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const thumb  = getMediaSource(stream.thumbnailUrl);
  const avatar = getMediaSource(stream.user.avatar);

  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.featured} onPress={onPress}>
      {/* Background */}
      {thumb
        ? <Image source={{ uri: thumb }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        : <LinearGradient colors={['#1e3a5f','#2d1b4e']} style={StyleSheet.absoluteFill} />
      }

      {/* Top gradient */}
      <LinearGradient
        colors={['rgba(0,0,0,0.45)', 'transparent']}
        style={styles.featuredTopGrad}
      />
      {/* Bottom gradient */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.92)']}
        style={styles.featuredBottomGrad}
      />

      {/* LIVE badge */}
      {stream.isLive && (
        <LiveBadge size="md" style={styles.featuredLive} />
      )}

      {/* Category top-right */}
      {stream.category && (
        <View style={styles.featuredCat}>
          <Text style={styles.featuredCatText}>{stream.category.title}</Text>
        </View>
      )}

      {/* Bottom info */}
      <View style={styles.featuredInfo}>
        <View style={styles.featuredRow}>
          <Avatar
            uri={avatar}
            name={stream.user.username}
            size={36}
            style={styles.featuredAvatar}
            fallbackColor={c.accentDark}
            initialColor="#fff"
            initialStyle={{ fontSize: 14 }}
          />
          <View style={styles.featuredMeta}>
            <Text style={styles.featuredTitle} numberOfLines={1}>{stream.title}</Text>
            <Text style={styles.featuredUsername}>{stream.user.username}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Recommended card ──────────────────────────────────────────

function RecCard({ stream, onPress }: { stream: StreamItem; onPress: () => void }) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const thumb  = getMediaSource(stream.thumbnailUrl);
  const avatar = getMediaSource(stream.user.avatar);

  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.recCard} onPress={onPress}>
      <View style={styles.recThumb}>
        {thumb
          ? <Image source={{ uri: thumb }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          : <LinearGradient colors={['#1a2a3a','#0d1a2b']} style={StyleSheet.absoluteFill} />
        }
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.recGrad}
        />
        {stream.isLive && (
          <LiveBadge size="md" style={styles.recLive} />
        )}
        <View style={styles.recBottom}>
          <Avatar
            uri={avatar}
            name={stream.user.username}
            size={18}
            style={styles.recAvatar}
            fallbackColor={c.accentDark}
            initialColor="#fff"
            initialStyle={{ fontSize: 8 }}
          />
          <Text style={styles.recUsername} numberOfLines={1}>{stream.user.username}</Text>
        </View>
      </View>
      <Text style={styles.recTitle} numberOfLines={2}>{stream.title}</Text>
    </TouchableOpacity>
  );
}

// ── Category card ─────────────────────────────────────────────

function CatCard({ category, onPress }: { category: CategoryItem; onPress: () => void }) {
  const styles = useThemedStyles(makeStyles);
  const thumb = getMediaSource(category.thumbnailUrl);
  return (
    <TouchableOpacity style={styles.catCard} activeOpacity={0.8} onPress={onPress}>
      {thumb
        ? <Image source={{ uri: thumb }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        : <LinearGradient colors={['#1a2a3a','#0d1a2b']} style={StyleSheet.absoluteFill} />
      }
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.75)']}
        style={StyleSheet.absoluteFill}
      />
      <Text style={styles.catName} numberOfLines={2}>{category.title}</Text>
    </TouchableOpacity>
  );
}

// ── Section header ────────────────────────────────────────────

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleWrap}>
        <View style={styles.sectionAccent} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll} activeOpacity={0.7}>
          <Text style={styles.seeAll}>{t('home.seeAll')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState('All');

  const categoryFilter = activeCategory === 'All' ? undefined : activeCategory;

  const { data: streamsData, loading: streamsLoading, refetch: refetchStreams, startPolling, stopPolling } = useQuery<{
    findRandomStreams: StreamItem[];
  }>(FIND_RANDOM_STREAMS, {
    variables: { filters: categoryFilter ? { categoryName: categoryFilter } : {} },
  });

  // Auto-refresh live status while the tab is focused (paused on blur to save
  // battery/network). Picks up streams going live/offline without a manual pull.
  useFocusEffect(
    useCallback(() => {
      startPolling(15000);
      return () => stopPolling();
    }, [startPolling, stopPolling]),
  );

  const { data: categoriesData, refetch: refetchCategories } = useQuery<{
    findRandomCategories: CategoryItem[];
  }>(FIND_RANDOM_CATEGORIES);

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchStreams(), refetchCategories()]);
    setRefreshing(false);
  }, []);

  const { data: unreadData } = useQuery<{ findNotificationUnreadCount: number }>(
    FIND_NOTIFICATION_UNREAD_COUNT,
    { fetchPolicy: 'network-only' },
  );

  const streams        = streamsData?.findRandomStreams ?? [];
  const categories     = categoriesData?.findRandomCategories ?? [];
  const categoryLabels = ['All', ...categories.map(c => c.title)];
  const unreadCount    = unreadData?.findNotificationUnreadCount ?? 0;
  const featured       = streams[0] ?? null;
  const recommended    = streams.slice(1);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.logo}>SPAIK</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
            <IconSearch size={19} color={c.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={() => router.push('/notifications' as any)}
          >
            <IconBell size={19} color={c.textSecondary} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={c.accent}
            colors={[c.accent]}
          />
        }
      >
        {/* ── Category pills ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
          {categoryLabels.map(label => (
            <CategoryPill
              key={label}
              label={label === 'All' ? t('common.all') : label}
              active={activeCategory === label}
              onPress={() => setActiveCategory(label)}
            />
          ))}
        </ScrollView>

        {streamsLoading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={c.accent} />
          </View>
        ) : (
          <>
            {/* ── Featured ── */}
            {featured && (
              <View style={styles.section}>
                <SectionHeader title={t('home.featured')} />
                <FeaturedCard
                  stream={featured}
                  onPress={() => router.push(`/channel/${featured.user.username}` as any)}
                />
              </View>
            )}

            {/* ── Recommended ── */}
            {recommended.length > 0 && (
              <View style={styles.section}>
                <SectionHeader
                  title={t('home.recommended')}
                  onSeeAll={() => router.push('/(tabs)/streams' as any)}
                />
                <FlatList
                  data={recommended}
                  keyExtractor={(_, i) => i.toString()}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.recList}
                  renderItem={({ item }) => (
                    <RecCard
                      stream={item}
                      onPress={() => router.push(`/channel/${item.user.username}` as any)}
                    />
                  )}
                />
              </View>
            )}

            {/* ── Categories ── */}
            {categories.length > 0 && (
              <View style={styles.section}>
                <SectionHeader title={t('home.categories')} />
                <FlatList
                  data={categories}
                  keyExtractor={c => c.slug}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.catList}
                  renderItem={({ item }) => (
                    <CatCard category={item} onPress={() => {}} />
                  )}
                />
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
  root:  { flex: 1, backgroundColor: c.bg },
  scroll: { paddingBottom: 24 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: H_PAD, paddingTop: 8, paddingBottom: 14,
  },
  logo: { fontSize: 24, fontWeight: '800', color: c.accent, letterSpacing: -0.5 },
  headerActions: { flexDirection: 'row', gap: 6 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: c.card, borderWidth: 1, borderColor: c.border,
    alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    position: 'absolute', top: -2, right: -2,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: c.danger,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5, borderColor: c.bg,
  },
  badgeText: { color: '#fff', fontSize: 8, fontWeight: '800' },

  // Pills
  pills: { paddingHorizontal: H_PAD, paddingBottom: 14, gap: 8 },

  loader: { paddingTop: 60, alignItems: 'center' },

  // Section
  section: { marginBottom: 28 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: H_PAD, marginBottom: 12,
  },
  sectionTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionAccent:    { width: 3, height: 16, borderRadius: 2, backgroundColor: c.accent },
  sectionTitle:     { fontSize: 16, fontWeight: '700', color: c.textPrimary },
  seeAll:           { fontSize: 13, color: c.accent },

  // Featured
  featured: {
    marginHorizontal: H_PAD, height: FEATURED_H,
    borderRadius: 16, overflow: 'hidden', backgroundColor: c.card,
  },
  featuredTopGrad:    { position: 'absolute', top: 0, left: 0, right: 0, height: 80 },
  featuredBottomGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%' },
  featuredLive: {
    position: 'absolute', top: 12, left: 12,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: c.live, borderRadius: 6,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  featuredCat: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 6,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  featuredCatText: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '600' },
  featuredInfo:   { position: 'absolute', bottom: 14, left: 12, right: 12 },
  featuredRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featuredAvatar: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
    flexShrink: 0,
  },
  featuredMeta:    { flex: 1 },
  featuredTitle:   { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 2 },
  featuredUsername: { fontSize: 12, color: 'rgba(255,255,255,0.65)' },

  // Recommended
  recList: { paddingHorizontal: H_PAD, gap: 12 },
  recCard: { width: REC_W },
  recThumb: {
    width: REC_W, height: REC_H,
    borderRadius: 14, overflow: 'hidden',
    backgroundColor: c.card, marginBottom: 7,
  },
  recGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%' },
  recLive: {
    position: 'absolute', top: 6, left: 6,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: c.live, borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 3,
  },
  recBottom: {
    position: 'absolute', bottom: 7, left: 7, right: 7,
    flexDirection: 'row', alignItems: 'center', gap: 5,
  },
  recAvatar: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  recUsername:       { fontSize: 11, fontWeight: '600', color: '#fff', flex: 1 },
  recTitle:          { fontSize: 12, fontWeight: '500', color: c.textPrimary, lineHeight: 17 },

  // Categories
  catList: { paddingHorizontal: H_PAD, gap: 10 },
  catCard: {
    width: CAT_W, height: CAT_H,
    borderRadius: 14, overflow: 'hidden',
    backgroundColor: c.card,
    justifyContent: 'flex-end', padding: 8,
  },
  catName: { fontSize: 11, fontWeight: '700', color: '#fff', lineHeight: 15 },
});
