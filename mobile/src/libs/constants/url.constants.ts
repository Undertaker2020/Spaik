import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;

export const SERVER_URL    = extra.apiUrl       ?? 'http://localhost:4000/graphql';
export const WEBSOCKET_URL = extra.wsUrl        ?? 'ws://localhost:4000/graphql';
export const MEDIA_URL     = extra.mediaUrl     ?? 'http://localhost:4000';
export const LIVEKIT_WS_URL = extra.livekitWsUrl ?? 'ws://localhost:7880';
