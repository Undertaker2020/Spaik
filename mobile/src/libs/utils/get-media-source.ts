import { MEDIA_URL } from '@/src/libs/constants/url.constants';

export function getMediaSource(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${MEDIA_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
