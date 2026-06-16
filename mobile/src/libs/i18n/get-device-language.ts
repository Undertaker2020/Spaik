import { defaultLanguage, type Language } from './config';

// Best-effort default from the device locale. Ukrainian reports ISO `uk`;
// everything else falls back to English (the app's default UI language).
//
// `expo-localization` is a *native* module — it isn't present until the dev
// client is rebuilt. We require it lazily inside a try/catch so a missing
// native module degrades gracefully (default language) instead of crashing
// the whole app at import time.
export function getDeviceLanguage(): Language {
  try {
    const Localization = require('expo-localization');
    const code = Localization.getLocales?.()[0]?.languageCode?.toLowerCase();
    if (code === 'uk' || code === 'ua') return 'ua';
  } catch {
    // Native module unavailable (dev client not rebuilt yet) — use the default.
  }
  return defaultLanguage;
}
