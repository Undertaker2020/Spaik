import Redis from 'ioredis';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

let client: Redis | null = null;

function redis(configService: ConfigService): Redis {
    if (!client) client = new Redis(configService.getOrThrow<string>('REDIS_URI'));
    return client;
}

// Reproduces express-session's cookie-signature unsign (HMAC-SHA256, base64,
// trailing '=' stripped) so we can validate the cookie the monolith set.
function unsign(input: string, secret: string): string | false {
    const idx = input.lastIndexOf('.');
    if (idx < 0) return false;
    const value = input.slice(0, idx);
    const expected = crypto
        .createHmac('sha256', secret)
        .update(value)
        .digest('base64')
        .replace(/=+$/, '');
    const provided = input.slice(idx + 1);
    const a = Buffer.from(expected);
    const b = Buffer.from(provided);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
    return value;
}

/**
 * Resolves the express-session cookie (set by the monolith, stored in Redis) to
 * a userId — so web clients (cookie auth) can call this service. Returns null if
 * there's no valid session.
 */
export async function resolveSessionUserId(
    req: any,
    configService: ConfigService,
): Promise<string | null> {
    const cookieHeader: string | undefined = req?.headers?.cookie;
    if (!cookieHeader) return null;

    const name = configService.getOrThrow<string>('SESSION_NAME');
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
    if (!match) return null;

    const raw = decodeURIComponent(match[1]);
    if (!raw.startsWith('s:')) return null;

    const sid = unsign(raw.slice(2), configService.getOrThrow<string>('SESSION_SECRET'));
    if (!sid) return null;

    const data = await redis(configService).get(
        configService.getOrThrow<string>('SESSION_FOLDER') + sid,
    );
    if (!data) return null;

    try {
        return JSON.parse(data).userId ?? null;
    } catch {
        return null;
    }
}
