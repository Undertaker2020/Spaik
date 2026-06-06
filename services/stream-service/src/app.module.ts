import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloFederationDriver } from '@nestjs/apollo';
import { JwtModule } from '@nestjs/jwt';
import { getGraphQlConfig } from '@/src/core/config/graphql.config';
import { getLiveKitConfig } from '@/src/core/config/livekit.config';
import { PrismaModule } from '@/src/core/prisma/prisma.module';
import { LiveKitModule } from '@/src/modules/libs/livekit/livekit.module';
import { StreamModule } from '@/src/modules/stream/stream.module';
import { IngressModule } from '@/src/modules/ingress/ingress.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        GraphQLModule.forRootAsync({
            driver: ApolloFederationDriver,
            imports: [ConfigModule],
            useFactory: getGraphQlConfig,
            inject: [ConfigService],
        }),
        JwtModule.registerAsync({
            global: true,
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.getOrThrow<string>('JWT_SECRET'),
            }),
        }),
        LiveKitModule.registerAsync({
            imports: [ConfigModule],
            useFactory: getLiveKitConfig,
            inject: [ConfigService],
        }),
        PrismaModule,
        StreamModule,
        IngressModule,
    ],
})
export class AppModule {}
