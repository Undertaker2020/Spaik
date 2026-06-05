import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloGatewayDriver, ApolloGatewayDriverConfig } from '@nestjs/apollo';
import { IntrospectAndCompose } from '@apollo/gateway';
import { AuthForwardingDataSource } from './auth-forwarding.datasource';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        GraphQLModule.forRootAsync<ApolloGatewayDriverConfig>({
            driver: ApolloGatewayDriver,
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                server: {
                    path: configService.getOrThrow<string>('GRAPHQL_PREFIX'),
                    // expose the incoming request so the data source can forward auth
                    context: ({ req }: { req: unknown }) => ({ req }),
                },
                gateway: {
                    supergraphSdl: new IntrospectAndCompose({
                        subgraphs: [
                            {
                                name: 'monolith',
                                url: configService.getOrThrow<string>('MONOLITH_SUBGRAPH_URL'),
                            },
                            {
                                name: 'chat',
                                url: configService.getOrThrow<string>('CHAT_SUBGRAPH_URL'),
                            },
                            {
                                name: 'media',
                                url: configService.getOrThrow<string>('MEDIA_SUBGRAPH_URL'),
                            },
                        ],
                    }),
                    buildService: ({ url }) => new AuthForwardingDataSource({ url }),
                },
            }),
        }),
    ],
})
export class AppModule {}
