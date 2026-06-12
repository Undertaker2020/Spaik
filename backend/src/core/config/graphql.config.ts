import type {ApolloFederationDriverConfig} from "@nestjs/apollo";
import {ConfigService} from "@nestjs/config";
import {isDev} from "../../shared/utils/is-dev.util";
import {join} from "path"

// The monolith is exposed as a Federation 2 subgraph. It remains a valid,
// directly-queryable GraphQL endpoint (clients are unchanged); a gateway can
// later compose it with the extracted Stream/Chat/Media subgraphs.
export function getGraphQlConfig(configService: ConfigService): ApolloFederationDriverConfig {
    return {
        playground: isDev(configService),
        path: configService.getOrThrow<string>('GRAPHQL_PREFIX'),
        autoSchemaFile: {
            path: join(process.cwd(), 'src/core/graphql/schema.gql'),
            federation: 2,
        },
        sortSchema: true,
        context: ({req, res}) => ({req, res}),
        // The monolith subgraph has no GraphQL subscriptions of its own (chat
        // subscriptions live in the chat-service, federated through the gateway).
        introspection: true
    }
}