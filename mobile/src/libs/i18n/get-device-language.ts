import * as Localization from 'expo-localization';
import { defaultLanguage, type Language } from './config';

// Best-effort default from the device locale. Ukrainian reports ISO `uk`;
// everything else falls back to English (the app's default UI language).
export function getDeviceLanguage(): Language {
  const code = Localization.getLocales()[0]?.languageCode?.toLowerCase();
  if (code === 'uk' || code === 'ua') return 'ua';
  return defaultLanguage;
}
