import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GraphQLSchemaHost } from '@nestjs/graphql';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/use/ws';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const config = app.get(ConfigService);

    app.useGlobalPipes(new ValidationPipe({ transform: true }));

    const allowedOrigins = config
        .getOrThrow<string>('ALLOWED_ORIGIN')
        .split(',')
        .map(o => o.trim());
    app.enableCors({ origin: allowedOrigins, credentials: true });

    await app.listen(config.getOrThrow<string>('CHAT_SERVICE_PORT'));

    // Federation driver does not serve subscriptions — mount a standalone
    // graphql-ws server on the same HTTP server/path, backed by the subgraph schema.
    const { schema } = app.get(GraphQLSchemaHost);
    const wsServer = new WebSocketServer({
        server: app.getHttpServer(),
        path: config.getOrThrow<string>('GRAPHQL_PREFIX'),
    });
    useServer({ schema }, wsServer);
}

bootstrap();
