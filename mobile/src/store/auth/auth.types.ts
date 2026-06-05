export interface AuthStore {
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
  // True once the persisted state has been rehydrated from storage.
  // Used to gate routing so we don't flash the login screen on cold start.
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
}
