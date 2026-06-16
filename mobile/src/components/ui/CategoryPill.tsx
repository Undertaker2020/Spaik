import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemedStyles } from '@/src/libs/theme/use-theme';
import type { Palette } from '@/src/libs/theme/palettes';

// Rounded category filter chip used by the home and streams tabs.
export function CategoryPill({ label, active, onPress }: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <TouchableOpacity onPress={onPress} style={[styles.pill, active && styles.pillActive]} activeOpacity={0.75}>
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    pill: {
      paddingHorizontal: 15, paddingVertical: 7, borderRadius: 99,
      borderWidth: 1, borderColor: c.border, backgroundColor: c.card,
    },
    pillActive:     { backgroundColor: c.accent, borderColor: c.accent },
    pillText:       { fontSize: 13, fontWeight: '500', color: c.textSecondary },
    pillTextActive: { color: '#000', fontWeight: '600' },
  });
