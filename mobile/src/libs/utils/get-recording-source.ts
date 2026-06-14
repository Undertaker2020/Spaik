import { RECORDINGS_URL } from '@/src/libs/constants/url.constants';

// Recording `url` is the object key within the recordings bucket; prepend the
// public bucket base (same idea as getMediaSource for thumbnails/avatars).
export function getRecordingSource(key: string | null | undefined): string | null {
  if (!key) return null;
  if (key.startsWith('http')) return key;
  return `${RECORDINGS_URL}/${key.startsWith('/') ? key.slice(1) : key}`;
}
