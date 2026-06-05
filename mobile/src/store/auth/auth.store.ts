import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthStore } from './auth.types';

export const useAuthStore = create(
  persist<AuthStore, [], [], Pick<AuthStore, 'isAuthenticated'>>(
    set => ({
      isAuthenticated: false,
      setIsAuthenticated: (value: boolean) => set({ isAuthenticated: value }),
      hasHydrated: false,
      setHasHydrated: (value: boolean) => set({ hasHydrated: value }),
    }),
    {
      name: 'auth',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist the auth flag; hasHydrated is always derived at runtime.
      partialize: state => ({ isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => state => {
        state?.setHasHydrated(true);
      },
    }
  )
);
