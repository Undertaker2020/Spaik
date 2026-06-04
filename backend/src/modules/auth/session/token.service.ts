import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@/src/core/redis/redis.service';
import { randomUUID } from 'crypto';
import type { SessionMetadata } from '@/src/shared/types/session-metadata.types';
import type { StringValue } from '@/src/shared/utils/ms.util';

export interface TokenPayload {
    sub: string;
    tokenId: string;
}

export interface RefreshTokenRecord {
    userId: string;
    tokenId: string;
    createdAt: string;
    metadata: SessionMetadata;
}

const REFRESH_PREFIX = 'refresh:';

@Injectable()
export class TokenService {
    private readonly refreshTtlSeconds: number;

    public constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly redisService: RedisService,
    ) {
        // Convert e.g. '7d' → seconds
        const raw = this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRES');
        this.refreshTtlSeconds = this.parseTtl(raw);
    }

    public async issueTokens(userId: string, metadata: SessionMetadata) {
        const tokenId = randomUUID();

        const accessToken = await this.jwtService.signAsync(
            { sub: userId, tokenId } satisfies TokenPayload,
            { expiresIn: this.configService.getOrThrow<StringValue>('JWT_ACCESS_EXPIRES') },
        );

        const record: RefreshTokenRecord = {
            userId,
            tokenId,
            createdAt: new Date().toISOString(),
            metadata,
        };

        await this.redisService.set(
            `${REFRESH_PREFIX}${userId}:${tokenId}`,
            JSON.stringify(record),
            'EX',
            this.refreshTtlSeconds,
        );

        const refreshToken = this.encodeRefreshToken(userId, tokenId);
        return { accessToken, refreshToken };
    }

    public async refreshTokens(encodedRefreshToken: string) {
        const decoded = this.decodeRefreshToken(encodedRefreshToken);
        if (!decoded) throw new UnauthorizedException('Invalid refresh token');

        const { userId, tokenId } = decoded;
        const key = `${REFRESH_PREFIX}${userId}:${tokenId}`;
        const raw = await this.redisService.get(key);

        if (!raw) throw new UnauthorizedException('Refresh token expired or revoked');

        const record: RefreshTokenRecord = JSON.parse(raw);

        // Rotate: delete old, issue new
        await this.redisService.del(key);
        return this.issueTokens(userId, record.metadata);
    }

    public async revokeToken(userId: string, tokenId: string) {
        await this.redisService.del(`${REFRESH_PREFIX}${userId}:${tokenId}`);
        return true;
    }

    public async findAllByUser(userId: string): Promise<RefreshTokenRecord[]> {
        const pattern = `${REFRESH_PREFIX}${userId}:*`;
        const keys = await this.redisService.keys(pattern);

        const records: RefreshTokenRecord[] = [];
        for (const key of keys) {
            const raw = await this.redisService.get(key);
            if (raw) records.push(JSON.parse(raw));
        }

        return records.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }

    public async findOne(userId: string, tokenId: string): Promise<RefreshTokenRecord | null> {
        const raw = await this.redisService.get(`${REFRESH_PREFIX}${userId}:${tokenId}`);
        return raw ? JSON.parse(raw) : null;
    }

    public verifyAccessToken(token: string): TokenPayload {
        try {
            return this.jwtService.verify<TokenPayload>(token);
        } catch {
            throw new UnauthorizedException('Invalid or expired access token');
        }
    }

    // ── Helpers ───────────────────────────────────────────────

    /** Encode userId + tokenId as base64 JSON for the refresh token value */
    private encodeRefreshToken(userId: string, tokenId: string): string {
        return Buffer.from(JSON.stringify({ userId, tokenId })).toString('base64url');
    }

    private decodeRefreshToken(token: string): { userId: string; tokenId: string } | null {
        try {
            return JSON.parse(Buffer.from(token, 'base64url').toString());
        } catch {
            return null;
        }
    }

    private parseTtl(value: string): number {
        const units: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
        const match = value.match(/^(\d+)([smhd])$/);
        if (!match) return 7 * 86400;
        return parseInt(match[1]) * (units[match[2]] ?? 1);
    }
}
