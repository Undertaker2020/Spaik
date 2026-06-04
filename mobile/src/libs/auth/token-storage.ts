import * as SecureStore from 'expo-secure-store';

// SecureStore keys must match [A-Za-z0-9._-]
const ACCESS_KEY = 'spaik.accessToken';
const REFRESH_KEY = 'spaik.refreshToken';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export async function saveTokens({ accessToken, refreshToken }: AuthTokens): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_KEY, accessToken),
    SecureStore.setItemAsync(REFRESH_KEY, refreshToken),
  ]);
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_KEY);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
  ]);
}
