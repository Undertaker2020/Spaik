import { defineConfig } from '@graphql-hive/gateway';

const allowedOrigins = (process.env.ALLOWED_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map(o => o.trim());

// chat subgraph's graphql-ws endpoint (http→ws of its subgraph URL)
const chatWsLocation = (process.env.CHAT_SUBGRAPH_URL ?? 'http://localhost:4001/graphql')
    .replace(/^http/, 'ws');

// Hive Gateway serving the composed supergraph. Mirrors the old NestJS
// AuthForwardingDataSource: forwards Authorization (mobile JWT) + Cookie (web
// session) to subgraphs, and relays Set-Cookie back so cookie login works
// through the gateway.
export const gatewayConfig = defineConfig({
    supergraph: './supergraph.graphql',

    // The chat subgraph serves subscriptions only over WebSocket (graphql-ws on
    // its /graphql path), not HTTP — so route its subscriptions over WS.
    transportEntries: {
        chat: {
            options: {
                subscriptions: {
                    kind: 'ws',
                    subgraph: 'chat',
                    location: chatWsLocation,
                },
            },
        },
    },

    propagateHeaders: {
        fromClientToSubgraphs: ({ request }) => ({
            authorization: request.headers.get('authorization') ?? '',
            cookie: request.headers.get('cookie') ?? '',
        }),
        fromSubgraphsToClient: ({ response }) => {
            const setCookie =
                typeof (response.headers as any).getSetCookie === 'function'
                    ? (response.headers as any).getSetCookie()
                    : response.headers.get('set-cookie');
            return setCookie ? { 'set-cookie': setCookie } : {};
        },
    },

    cors: {
        origin: allowedOrigins,
        credentials: true,
    },
});
