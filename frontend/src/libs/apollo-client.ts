import {ApolloClient, HttpLink, InMemoryCache, split} from "@apollo/client";
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { createClient } from 'graphql-ws'
import {GATEWAY_URL, SERVER_URL, WEBSOCKET_URL} from "@/libs/constants/url.constants";
import createUploadLink from "apollo-upload-client/createUploadLink.mjs";
import {getMainDefinition} from "@apollo/client/utilities";

// Queries & mutations → federation gateway (composes monolith + chat-service)
const gatewayLink = new HttpLink({
    uri: GATEWAY_URL,
    credentials: 'include',
})

// File uploads (changeProfileAvatar / changeStreamThumbnail) can't go through
// the gateway — Apollo Federation doesn't support multipart — so route any
// operation carrying a File/Blob straight to the monolith.
const uploadLink = createUploadLink({
    uri: SERVER_URL,
    credentials: 'include',
    headers: {
        'apollo-require-preflight': 'true'
    }
})

function hasFiles(value: unknown, seen = new Set<unknown>()): boolean {
    if (!value || typeof value !== 'object' || seen.has(value)) return false
    if (typeof File !== 'undefined' && value instanceof File) return true
    if (typeof Blob !== 'undefined' && value instanceof Blob) return true
    seen.add(value)
    return Object.values(value as Record<string, unknown>).some(v => hasFiles(v, seen))
}

const httpLink = split(
    operation => hasFiles(operation.variables),
    uploadLink,
    gatewayLink,
)

// graphql-ws (modern protocol) → chat-service WS. The gateway doesn't federate
// subscriptions, so they connect to the owning subgraph directly.
// Auth on web is cookie-based, sent with the WS handshake.
const wsLink = new GraphQLWsLink(
    createClient({
        url: WEBSOCKET_URL,
        retryAttempts: Infinity,
    })
)

const splitLink = split(
    ({ query }) => {
        const definition = getMainDefinition(query)

        return (
            definition.kind === 'OperationDefinition' &&
            definition.operation === 'subscription'
        )
    },
    wsLink,
    httpLink
)

export const client = new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache()
})
