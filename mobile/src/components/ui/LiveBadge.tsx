import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useColors } from '@/src/libs/theme/use-theme';

// Solid "LIVE" overlay badge (dot + label) used on stream cards/thumbnails.
// `size` picks the dot/label/padding scale; `style` overrides position (and
// any per-card padding/radius tweaks).
const SIZES = {
  sm: { dot: 5, text: 9,  gap: 4, padH: 6, padV: 3, radius: 5 },
  md: { dot: 6, text: 10, gap: 5, padH: 9, padV: 4, radius: 6 },
} as const;

export function LiveBadge({ size = 'md', style }: {
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}) {
  const c = useColors();
  const s = SIZES[size];
  return (
    <View
      style={[
        {
          flexDirection: 'row', alignItems: 'center', gap: s.gap,
          backgroundColor: c.live, borderRadius: s.radius,
          paddingHorizontal: s.padH, paddingVertical: s.padV,
        },
        style,
      ]}
    >
      <View style={{ width: s.dot, height: s.dot, borderRadius: s.dot / 2, backgroundColor: '#fff' }} />
      <Text style={{ color: '#fff', fontSize: s.text, fontWeight: '800', letterSpacing: 0.4 }}>LIVE</Text>
    </View>
  );
}
