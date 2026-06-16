import {
  Image,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
} from 'react-native';
import { useColors } from '@/src/libs/theme/use-theme';

// Circular avatar with an initial fallback when there's no image.
// Visual knobs (ring/border via `style`, fallback bg/initial colour) are
// props so every existing call site keeps its exact look.
export function Avatar({
  uri,
  name,
  size,
  style,
  fallbackColor,
  initialColor,
  initialStyle,
}: {
  uri: string | null | undefined;
  name: string | null | undefined;
  size: number;
  style?: StyleProp<ViewStyle>;
  fallbackColor?: string;
  initialColor?: string;
  initialStyle?: StyleProp<TextStyle>;
}) {
  const c = useColors();
  const dim = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return <Image source={{ uri }} style={[dim, style] as StyleProp<ImageStyle>} />;
  }

  const initial = (name ?? '?').charAt(0).toUpperCase();
  return (
    <View style={[dim, { alignItems: 'center', justifyContent: 'center', backgroundColor: fallbackColor ?? c.card }, style]}>
      <Text style={[{ fontWeight: '700', color: initialColor ?? c.accent, fontSize: Math.round(size * 0.4) }, initialStyle]}>
        {initial}
      </Text>
    </View>
  );
}
