// Supported UI languages. Keys mirror the web app (`ua` not the ISO `uk`).
export const languages = ['en', 'ua'] as const;
export type Language = (typeof languages)[number];

export const defaultLanguage: Language = 'en';

export const LANGUAGE_LABELS: Record<Language, { native: string; english: string }> = {
  en: { native: 'English', english: 'English' },
  ua: { native: 'Українська', english: 'Ukrainian' },
};
