import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthStore } from './auth.types';

export const useAuthStore = create(
  persist<AuthStore>(
    set => ({
      isAuthenticated: false,
      setIsAuthenticated: (value: boolean) => set({ isAuthenticated: value }),
    }),
    {
      name: 'auth',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
