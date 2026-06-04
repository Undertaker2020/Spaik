import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';
import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;

const SERVER_URL = extra.apiUrl ?? 'http://localhost:4000/graphql';
const WEBSOCKET_URL = extra.wsUrl ?? 'ws://localhost:4000/graphql';

const httpLink = new HttpLink({
  uri: SERVER_URL,
  credentials: 'include',
  headers: {
    'apollo-require-preflight': 'true',
  },
});

// graphql-ws uses the native WebSocket available in React Native
const wsLink = new GraphQLWsLink(
  createClient({
    url: WEBSOCKET_URL,
    retryAttempts: Infinity,
    shouldRetry: () => true,
  })
);

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink
);

export const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});
