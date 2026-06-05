import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const config = app.get(ConfigService);

    const allowedOrigins = config
        .getOrThrow<string>('ALLOWED_ORIGIN')
        .split(',')
        .map(o => o.trim());
    app.enableCors({ origin: allowedOrigins, credentials: true });

    await app.listen(config.getOrThrow<string>('GATEWAY_PORT'));
}

bootstrap();
