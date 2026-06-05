import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import Redis, { RedisOptions } from 'ioredis';

// DI token for the Redis-backed GraphQL PubSub. The same Redis channel is used
// by the monolith, so chat events fan out across both while chat runs in
// parallel, and across multiple chat-service instances once it scales.
export const PUB_SUB = 'PUB_SUB';

export const PubSubProvider: Provider = {
    provide: PUB_SUB,
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => {
        const uri = configService.getOrThrow<string>('REDIS_URI');

        const options: RedisOptions = {
            retryStrategy: times => Math.min(times * 50, 2000),
        };

        return new RedisPubSub({
            // dual-ioredis typings clash at compile time; same client at runtime
            publisher: new Redis(uri, options) as never,
            subscriber: new Redis(uri, options) as never,
        });
    },
};
