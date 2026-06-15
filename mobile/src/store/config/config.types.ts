import type { AccentKey, ThemeMode } from '@/src/libs/theme/palettes';

export type ThemeColor = AccentKey;

export interface ConfigStore {
  theme: ThemeColor; // accent colour
  mode: ThemeMode;   // dark / light
  setTheme: (theme: ThemeColor) => void;
  setMode: (mode: ThemeMode) => void;
}
