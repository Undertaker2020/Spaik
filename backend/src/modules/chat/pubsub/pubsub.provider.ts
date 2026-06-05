import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import Redis, { RedisOptions } from 'ioredis';

/**
 * DI token for the chat's Redis-backed GraphQL PubSub.
 *
 * Replaces the previous in-memory `new PubSub()` so subscriptions can be
 * fanned out across multiple instances through a shared Redis channel —
 * the prerequisite for running Chat as an independently scaled service.
 */
export const PUB_SUB = 'PUB_SUB';

export const PubSubProvider: Provider = {
    provide: PUB_SUB,
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => {
        const uri = configService.getOrThrow<string>('REDIS_URI');

        // graphql-redis-subscriptions needs DEDICATED connections: a Redis
        // connection in subscriber mode cannot issue normal commands, so the
        // subscriber must be separate from both the publisher and the app's
        // shared RedisService (which backs sessions/refresh tokens).
        const options: RedisOptions = {
            retryStrategy: times => Math.min(times * 50, 2000),
        };

        // graphql-redis-subscriptions bundles its own ioredis typings, so the
        // project's `Redis` type and the lib's expected `RedisClient` clash at
        // compile time even though they're the same ioredis at runtime — cast.
        return new RedisPubSub({
            publisher: new Redis(uri, options) as never,
            subscriber: new Redis(uri, options) as never,
        });
    },
};
