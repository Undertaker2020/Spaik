import type { AccentKey, ThemeMode } from '@/src/libs/theme/palettes';
import type { Language } from '@/src/libs/i18n/config';

export type ThemeColor = AccentKey;

export interface ConfigStore {
  theme: ThemeColor;   // accent colour
  mode: ThemeMode;     // dark / light
  language: Language;  // UI language (en / ua)
  setTheme: (theme: ThemeColor) => void;
  setMode: (mode: ThemeMode) => void;
  setLanguage: (language: Language) => void;
}
