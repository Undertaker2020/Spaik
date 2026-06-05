import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloFederationDriver } from '@nestjs/apollo';
import { JwtModule } from '@nestjs/jwt';
import { getGraphQlConfig } from '@/src/core/config/graphql.config';
import { PrismaModule } from '@/src/core/prisma/prisma.module';
import { ChatModule } from '@/src/modules/chat/chat.module';

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
        PrismaModule,
        ChatModule,
    ],
})
export class AppModule {}
