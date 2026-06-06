import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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

    await app.listen(config.getOrThrow<string>('STREAM_SERVICE_PORT'));
}

bootstrap();
