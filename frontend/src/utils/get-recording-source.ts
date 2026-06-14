import { RECORDINGS_URL } from '@/libs/constants/url.constants'

// Recording `url` is the object key within the recordings bucket; prepend the
// public bucket base (same idea as getMediaSource for thumbnails/avatars).
export function getRecordingSource(key: string | undefined | null) {
    return `${RECORDINGS_URL}/${key}`
}
