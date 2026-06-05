import {ApolloClient, InMemoryCache, split} from "@apollo/client";
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { createClient } from 'graphql-ws'
import {SERVER_URL, WEBSOCKET_URL} from "@/libs/constants/url.constants";
import createUploadLink from "apollo-upload-client/createUploadLink.mjs";
import {getMainDefinition} from "@apollo/client/utilities";

const httpLink = createUploadLink({
    uri: SERVER_URL,
    credentials: 'include',
    headers: {
        'apollo-require-preflight': 'true'
    }
})

// graphql-ws (modern protocol) — matches the backend's standalone WS server.
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