// Design tokens extracted from spaik-wireframes.html
export const COLORS = {
  // Backgrounds
  bg:      '#1A1D27', // main screen background
  nav:     '#12141E', // bottom tab bar
  card:    '#2A2D3A', // cards, inputs, list items
  outer:   '#0F1117', // deepest background

  // Brand
  accent:      '#18B9AE',
  accentDark:  '#0E8F86',

  // Borders
  border:  '#2A2D3A',

  // Text
  textPrimary:   '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted:     '#6B7280',
  textDisabled:  '#4B5563',

  // Semantic
  danger: '#E53E3E',
  live:   '#E53E3E',
} as const;

export type ColorKey = keyof typeof COLORS;
