import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@apollo/client';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSearch, IconX, IconDeviceTv } from '@tabler/icons-react-native';
import { useRouter } from 'expo-router';
import { useColors, useThemedStyles } from '@/src/libs/theme/use-theme';
import type { Palette } from '@/src/libs/theme/palettes';
import { CategoryPill } from '@/src/components/ui/CategoryPill';
import { Avatar } from '@/src/components/ui/Avatar';
import { LiveBadge } from '@/src/components/ui/LiveBadge';
import { getMediaSource } from '@/src/libs/utils/get-media-source';
import {
  FIND_ALL_STREAMS,
  FIND_RANDOM_CATEGORIES,
  type StreamItem,
  type CategoryItem,
} from '@/src/graphql/queries/home.queries';

const PAGE_SIZE = 12;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GAP        = 10;
const H_PAD      = 16;
const CARD_WIDTH = (SCREEN_WIDTH - H_PAD * 2 - GAP) / 2;
const CARD_H     = CARD_WIDTH * (9 / 16);

// ── Stream card ───────────────────────────────────────────────

function StreamCard({ stream, onPress }: { stream: StreamItem; onPress: () => void }) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const thumb  = getMediaSource(stream.thumbnailUrl);
  const avatar = getMediaSource(stream.user.avatar);

  return (
    <TouchableOpacity activeOpacity={0.88} style={styles.card} onPress={onPress}>
      {/* Thumbnail */}
      <View style={styles.thumb}>
        {thumb
          ? <Image source={{ uri: thumb }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          : <LinearGradient
              colors={['#1a2a3a', '#0d1a2b']}
              style={StyleSheet.absoluteFill}
            />
        }

        {/* Bottom gradient */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.82)']}
          style={styles.thumbGradient}
        />

        {/* Top badges */}
        <View style={styles.thumbTop}>
          {stream.isLive && <LiveBadge size="sm" />}
          {stream.category && (
            <View style={styles.catBadge}>
              <Text style={styles.catBadgeText} numberOfLines={1}>{stream.category.title}</Text>
            </View>
          )}
        </View>

        {/* Bottom info inside card */}
        <View style={styles.thumbBottom}>
          <View style={styles.thumbUser}>
            <Avatar
              uri={avatar}
              name={stream.user.username}
              size={20}
              style={styles.thumbAvatar}
              fallbackColor={c.accentDark}
              initialColor="#fff"
              initialStyle={{ fontSize: 9 }}
            />
            <Text style={styles.thumbUsername} numberOfLines={1}>
              {stream.user.username}
            </Text>
          </View>
        </View>
      </View>

      {/* Title below card */}
      <Text style={styles.cardTitle} numberOfLines={2}>{stream.title}</Text>
    </TouchableOpacity>
  );
}

// ── Empty state ───────────────────────────────────────────────

function EmptyState({ loading, hasSearch }: { loading: boolean; hasSearch: boolean }) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={c.accent} />
    </View>
  );
  return (
    <View style={styles.center}>
      <View style={styles.emptyIcon}>
        <IconDeviceTv size={28} color={c.textMuted} strokeWidth={1.4} />
      </View>
      <Text style={styles.emptyTitle}>
        {hasSearch ? t('streams.found.title') : t('streams.empty.title')}
      </Text>
      <Text style={styles.emptySub}>
        {hasSearch ? t('streams.found.sub') : t('streams.empty.sub')}
      </Text>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────

export default function StreamsScreen() {
  const router = useRouter();
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  const [search,         setSearch]         = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [allStreams,     setAllStreams]      = useState<StreamItem[]>([]);
  const [hasMore,        setHasMore]        = useState(true);
  const [moreSkip,       setMoreSkip]       = useState<number | null>(null);
  const [refreshing,     setRefreshing]     = useState(false);

  const categoryFilter = activeCategory === 'All' ? undefined : activeCategory;

  const { data: initialData, loading, refetch: refetchStreams } = useQuery<{
    findAllStreams: StreamItem[];
  }>(FIND_ALL_STREAMS, {
    variables: { filters: { searchTerm: search, categoryName: categoryFilter, skip: 0, take: PAGE_SIZE } },
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    if (!initialData) return;
    const items = initialData.findAllStreams ?? [];
    setAllStreams(items);
    setHasMore(items.length === PAGE_SIZE);
    setMoreSkip(null);
  }, [initialData]);

  const { data: moreData, loading: loadingMore } = useQuery<{ findAllStreams: StreamItem[] }>(
    FIND_ALL_STREAMS,
    {
      variables: { filters: { searchTerm: search, categoryName: categoryFilter, skip: moreSkip ?? 0, take: PAGE_SIZE } },
      skip: moreSkip === null,
      fetchPolicy: 'network-only',
    }
  );

  useEffect(() => {
    if (!moreData || moreSkip === null) return;
    const items = moreData.findAllStreams ?? [];
    setAllStreams(prev => [...prev, ...items]);
    setHasMore(items.length === PAGE_SIZE);
    setMoreSkip(null);
  }, [moreData]);

  const { data: categoriesData } = useQuery<{ findRandomCategories: CategoryItem[] }>(FIND_RANDOM_CATEGORIES);
  const categoryLabels = ['All', ...(categoriesData?.findRandomCategories ?? []).map(c => c.title)];

  const liveCount = allStreams.filter(s => s.isLive).length;

  const reset = () => { setAllStreams([]); setHasMore(true); setMoreSkip(null); };

  const onSearch = useCallback((text: string) => {
    setSearch(text);
    reset();
  }, []);

  const onCategoryChange = useCallback((label: string) => {
    setActiveCategory(label);
    reset();
  }, []);

  const onLoadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore || moreSkip !== null) return;
    setMoreSkip(allStreams.length);
  }, [loading, loadingMore, hasMore, moreSkip, allStreams.length]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setAllStreams([]);
    setHasMore(true);
    setMoreSkip(null);
    await refetchStreams();
    setRefreshing(false);
  }, []);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('streams.title')}</Text>
        {liveCount > 0 && (
          <View style={styles.liveCount}>
            <View style={styles.liveCountDot} />
            <Text style={styles.liveCountText}>{t('streams.liveCount', { count: liveCount })}</Text>
          </View>
        )}
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <IconSearch size={16} color={c.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('streams.searchPlaceholder')}
          placeholderTextColor={c.textMuted}
          value={search}
          onChangeText={onSearch}
          returnKeyType="search"
          selectionColor={c.accent}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => onSearch('')} activeOpacity={0.7} hitSlop={8}>
            <IconX size={15} color={c.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category pills */}
      <FlatList
        data={categoryLabels}
        keyExtractor={item => item}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pills}
        style={styles.pillsRow}
        renderItem={({ item }) => (
          <CategoryPill
            label={item === 'All' ? t('common.all') : item}
            active={activeCategory === item}
            onPress={() => onCategoryChange(item)}
          />
        )}
      />

      {/* Grid */}
      <FlatList
        data={allStreams}
        keyExtractor={(_, i) => i.toString()}
        numColumns={2}
        style={styles.flex}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.4}
        renderItem={({ item }) => (
          <StreamCard
            stream={item}
            onPress={() => router.push(`/channel/${item.user.username}` as any)}
          />
        )}
        ListEmptyComponent={<EmptyState loading={loading} hasSearch={search.length > 0} />}
        ListFooterComponent={
          loadingMore
            ? <ActivityIndicator size="small" color={c.accent} style={styles.footerLoader} />
            : null
        }
      />
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
  root:  { flex: 1, backgroundColor: c.bg },
  flex:  { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: H_PAD, paddingTop: 8, paddingBottom: 14,
  },
  title: { fontSize: 24, fontWeight: '700', color: c.textPrimary },
  liveCount: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(229,62,62,0.12)',
    borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(229,62,62,0.25)',
  },
  liveCountDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.live },
  liveCountText: { fontSize: 12, fontWeight: '700', color: c.live },

  // Search
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: c.card,
    borderRadius: 14,
    marginHorizontal: H_PAD, marginBottom: 12,
    paddingHorizontal: 13, paddingVertical: 11,
    borderWidth: 1, borderColor: c.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: c.textPrimary, padding: 0 },

  // Pills
  pillsRow: { flexGrow: 0, marginBottom: 14 },
  pills:    { paddingHorizontal: H_PAD, gap: 8 },

  // Grid
  grid:    { paddingHorizontal: H_PAD, paddingBottom: 20 },
  gridRow: { justifyContent: 'space-between', marginBottom: 20 },

  // Card
  card: { width: CARD_WIDTH },
  thumb: {
    width: CARD_WIDTH, height: CARD_H,
    borderRadius: 14, overflow: 'hidden',
    backgroundColor: c.card, marginBottom: 8,
  },
  thumbGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '65%',
  },
  thumbTop: {
    position: 'absolute', top: 7, left: 7, right: 7,
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', gap: 4,
  },
  catBadge: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 5, paddingHorizontal: 6, paddingVertical: 3,
    maxWidth: CARD_WIDTH * 0.55,
  },
  catBadgeText: { color: 'rgba(255,255,255,0.85)', fontSize: 9, fontWeight: '600' },

  thumbBottom: {
    position: 'absolute', bottom: 7, left: 7, right: 7,
  },
  thumbUser: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  thumbAvatar: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  thumbUsername: { fontSize: 11, fontWeight: '600', color: '#fff', flex: 1 },

  cardTitle: { fontSize: 12, fontWeight: '500', color: c.textPrimary, lineHeight: 17 },

  // Empty
  center: { flex: 1, paddingTop: 60, alignItems: 'center', gap: 10 },
  emptyIcon: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: c.card, alignItems: 'center', justifyContent: 'center',
    marginBottom: 4, borderWidth: 1, borderColor: c.border,
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: c.textPrimary },
  emptySub:   { fontSize: 13, color: c.textMuted },

  footerLoader: { paddingVertical: 16 },
});
