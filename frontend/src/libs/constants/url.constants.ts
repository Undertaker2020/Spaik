export const APP_URL = process.env.NEXT_PUBLIC_APP_URL as string
// Monolith — direct (non-federated calls if any)
export const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL as string
// Federation gateway — queries & mutations
export const GATEWAY_URL = (process.env.NEXT_PUBLIC_GATEWAY_URL as string) ?? 'http://localhost:4002/graphql'
// Media-service — file uploads go here directly (gateway can't do multipart)
export const MEDIA_SERVICE_URL = (process.env.NEXT_PUBLIC_MEDIA_SERVICE_URL as string) ?? 'http://localhost:4003/graphql'
// Subscriptions WS — now served by the Hive gateway (e.g. ws://localhost:4002/graphql),
// which federates them over WS to the chat subgraph.
export const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL as string
export const MEDIA_URL = process.env.NEXT_PUBLIC_MEDIA_URL as string
export const GOOGLE_MAP_API = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string
export const LIVEKIT_WS_URL = process.env.NEXT_PUBLIC_LIVEKIT_WS_URL as string