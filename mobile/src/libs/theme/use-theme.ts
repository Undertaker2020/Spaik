import { useMemo } from 'react';
import { useConfigStore } from '@/src/store/config/config.store';
import { ACCENTS, BASE_PALETTES, type Palette } from '@/src/libs/theme/palettes';

// Active palette = mode base colors + chosen accent. Reactive: re-derives when
// the user changes mode/accent in the config store.
export function useColors(): Palette {
  const mode = useConfigStore(s => s.mode);
  const accent = useConfigStore(s => s.theme);
  return useMemo(() => ({ ...BASE_PALETTES[mode], ...ACCENTS[accent] }), [mode, accent]);
}

// Memoize a themed StyleSheet per active palette. The factory should call
// StyleSheet.create itself, e.g.:
//   const makeStyles = (c: Palette) => StyleSheet.create({ root: { backgroundColor: c.bg } })
//   const styles = useThemedStyles(makeStyles)
// Define makeStyles at module scope so it's a stable reference.
export function useThemedStyles<T>(factory: (c: Palette) => T): T {
  const c = useColors();
  return useMemo(() => factory(c), [c, factory]);
}
