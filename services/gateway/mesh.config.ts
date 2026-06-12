import { defineConfig, loadGraphQLHTTPSubgraph } from '@graphql-mesh/compose-cli';

// Composes the 4 federation subgraphs into a single supergraph.graphql that
// Hive Gateway serves. Subgraphs must be running when this is composed.
// Run: npx mesh-compose -o supergraph.graphql
export const composeConfig = defineConfig({
    subgraphs: [
        {
            sourceHandler: loadGraphQLHTTPSubgraph('monolith', {
                endpoint: process.env.MONOLITH_SUBGRAPH_URL ?? 'http://localhost:4000/graphql',
            }),
        },
        {
            sourceHandler: loadGraphQLHTTPSubgraph('chat', {
                endpoint: process.env.CHAT_SUBGRAPH_URL ?? 'http://localhost:4001/graphql',
            }),
        },
        {
            sourceHandler: loadGraphQLHTTPSubgraph('media', {
                endpoint: process.env.MEDIA_SUBGRAPH_URL ?? 'http://localhost:4003/graphql',
            }),
        },
        {
            sourceHandler: loadGraphQLHTTPSubgraph('stream', {
                endpoint: process.env.STREAM_SUBGRAPH_URL ?? 'http://localhost:4004/graphql',
            }),
        },
    ],
});
