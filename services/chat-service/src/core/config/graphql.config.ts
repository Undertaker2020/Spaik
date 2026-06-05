import type { ApolloFederationDriverConfig } from '@nestjs/apollo';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

// Chat is exposed as a Federation 2 subgraph. Subscriptions are served by a
// standalone graphql-ws server in main.ts (the federation driver refuses
// installSubscriptionHandlers), backed by the same executable schema.
export function getGraphQlConfig(
    configService: ConfigService,
): ApolloFederationDriverConfig {
    return {
        playground: configService.get<string>('NODE_ENV') !== 'production',
        path: configService.getOrThrow<string>('GRAPHQL_PREFIX'),
        autoSchemaFile: {
            path: join(process.cwd(), 'src/core/graphql/schema.gql'),
            federation: 2,
        },
        sortSchema: true,
        context: ({ req, res }) => ({ req, res }),
        introspection: true,
    };
}
