import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  split,
  from,
  fromPromise,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { GATEWAY_URL, CHAT_WS_URL } from '@/src/libs/constants/url.constants';
import {
  getAccessToken,
  getRefreshToken,
  saveTokens,
  clearTokens,
} from '@/src/libs/auth/token-storage';
import { useAuthStore } from '@/src/store/auth/auth.store';

// Queries & mutations → federation gateway
const httpLink = new HttpLink({
  uri: GATEWAY_URL,
  headers: {
    'apollo-require-preflight': 'true',
  },
});

// Subscriptions → chat-service WS (gateway doesn't federate subscriptions)
const wsLink = new GraphQLWsLink(
  createClient({
    url: CHAT_WS_URL,
    retryAttempts: Infinity,
    shouldRetry: () => true,
    connectionParams: async () => {
      const token = await getAccessToken();
      return token ? { Authorization: `Bearer ${token}` } : {};
    },
  })
);

// ── Attach bearer token to every HTTP request ─────────────────
const authLink = setContext(async (_, { headers }) => {
  const token = await getAccessToken();
  return {
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
});

// ── Auto-refresh on expired/invalid access token ──────────────
// Single-flight: concurrent 401s share one in-flight refresh call.
let refreshPromise: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query:
          'mutation($t:String!){refreshTokens(refreshToken:$t){accessToken refreshToken}}',
        variables: { t: refreshToken },
      }),
    });
    const json = await res.json();
    const tokens = json?.data?.refreshTokens;
    if (!tokens?.accessToken || !tokens?.refreshToken) return null;
    await saveTokens(tokens);
    return tokens.accessToken;
  } catch {
    return null;
  }
}

function getRefreshedToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function forceLogout(): Promise<void> {
  await clearTokens();
  useAuthStore.getState().setIsAuthenticated(false);
}

const errorLink = onError(({ graphQLErrors, operation, forward }) => {
  if (!graphQLErrors) return;

  const isUnauthenticated = graphQLErrors.some(
    e => e.extensions?.code === 'UNAUTHENTICATED'
  );
  if (!isUnauthenticated) return;

  // Never try to refresh the auth calls themselves
  const opName = operation.operationName;
  if (opName === 'RefreshTokens' || opName === 'LoginUser' || opName === 'CreateUser') {
    return;
  }

  // Already retried once → give up, log out, let the error propagate
  if (operation.getContext()._authRetried) {
    void forceLogout();
    return;
  }

  return fromPromise(getRefreshedToken()).flatMap(newToken => {
    operation.setContext(({ headers = {} }: { headers?: Record<string, string> }) => ({
      headers: newToken
        ? { ...headers, Authorization: `Bearer ${newToken}` }
        : headers,
      _authRetried: true,
    }));

    if (!newToken) void forceLogout();

    return forward(operation);
  });
});

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  from([errorLink, authLink, httpLink])
);

export const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});
