import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ua from './locales/ua.json';
import { defaultLanguage } from './config';
import { useConfigStore } from '@/src/store/config/config.store';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ua: { translation: ua },
  },
  lng: useConfigStore.getState().language,
  fallbackLng: defaultLanguage,
  interpolation: { escapeValue: false },
  returnNull: false,
});

// Keep i18next in sync with the persisted language preference. This also
// covers the async AsyncStorage rehydration that fires after this module
// loads (initial `lng` above is the device/default until then).
useConfigStore.subscribe((state, prev) => {
  if (state.language && state.language !== prev.language) {
    void i18n.changeLanguage(state.language);
  }
});

export default i18n;
