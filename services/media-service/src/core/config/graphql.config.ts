import type { ApolloFederationDriverConfig } from '@nestjs/apollo';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

// Media is exposed as a Federation 2 subgraph. Its upload mutations carry
// multipart files, so clients call them DIRECTLY (the gateway can't proxy
// multipart) — the same direct-access pattern chat subscriptions use.
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
