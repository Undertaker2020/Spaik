import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;

// Monolith — direct (e.g. media). SERVER_URL kept for non-federated direct calls.
export const SERVER_URL    = extra.apiUrl       ?? 'http://localhost:4000/graphql';
// Federation gateway — queries & mutations go here.
export const GATEWAY_URL   = extra.gatewayUrl   ?? 'http://localhost:4002/graphql';
// Chat-service WS — subscriptions go here (gateway doesn't federate them).
export const CHAT_WS_URL   = extra.chatWsUrl    ?? 'ws://localhost:4001/graphql';
export const WEBSOCKET_URL = extra.wsUrl        ?? 'ws://localhost:4000/graphql';
export const MEDIA_URL     = extra.mediaUrl     ?? 'http://localhost:4000';
export const LIVEKIT_WS_URL = extra.livekitWsUrl ?? 'ws://localhost:7880';
