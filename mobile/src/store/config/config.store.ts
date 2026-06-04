import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ConfigStore } from './config.types';

export const useConfigStore = create(
  persist<ConfigStore>(
    set => ({
      theme: 'turquoise',
      setTheme: theme => set({ theme }),
    }),
    {
      name: 'config',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
