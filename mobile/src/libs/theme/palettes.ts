// Theme palettes. Base (non-accent) colors per mode + a separate accent map.
// useColors() merges the active mode palette with the chosen accent.

export const ACCENTS = {
  turquoise: { accent: '#18B9AE', accentDark: '#0E8F86' },
  purple:    { accent: '#7C3AED', accentDark: '#5B21B6' },
  blue:      { accent: '#2563EB', accentDark: '#1D4ED8' },
  green:     { accent: '#059669', accentDark: '#047857' },
} as const;

export type AccentKey = keyof typeof ACCENTS;
export type ThemeMode = 'dark' | 'light';

type BaseColors = {
  bg: string;
  nav: string;
  card: string;
  outer: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textDisabled: string;
  danger: string;
  live: string;
};

const dark: BaseColors = {
  bg:     '#1A1D27',
  nav:    '#12141E',
  card:   '#2A2D3A',
  outer:  '#0F1117',
  border: '#2A2D3A',
  textPrimary:   '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted:     '#6B7280',
  textDisabled:  '#4B5563',
  danger: '#E53E3E',
  live:   '#E53E3E',
} as const;

const light: BaseColors = {
  bg:     '#FFFFFF',
  nav:    '#FFFFFF',
  card:   '#F3F4F6',
  outer:  '#E5E7EB',
  border: '#E5E7EB',
  textPrimary:   '#111827',
  textSecondary: '#4B5563',
  textMuted:     '#9CA3AF',
  textDisabled:  '#D1D5DB',
  danger: '#DC2626',
  live:   '#E53E3E',
} as const;

export const BASE_PALETTES: Record<ThemeMode, BaseColors> = { dark, light };

// Full palette = mode base + accent. Shape matches the legacy COLORS object so
// screens can swap `COLORS.x` → `c.x` 1:1.
export type Palette = BaseColors & { accent: string; accentDark: string };
