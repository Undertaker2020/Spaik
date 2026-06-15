import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDeviceLanguage } from '@/src/libs/i18n/get-device-language';
import type { ConfigStore } from './config.types';

export const useConfigStore = create(
  persist<ConfigStore>(
    set => ({
      theme: 'turquoise',
      mode: 'dark',
      language: getDeviceLanguage(),
      setTheme: theme => set({ theme }),
      setMode: mode => set({ mode }),
      setLanguage: language => set({ language }),
    }),
    {
      name: 'config',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
