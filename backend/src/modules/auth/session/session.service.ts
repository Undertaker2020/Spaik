import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
    UnauthorizedException
} from '@nestjs/common';
import {PrismaService} from "@/src/core/prisma/prisma.service";
import {LoginInput} from "@/src/modules/auth/session/inputs/login.input";
import {verify} from "argon2";
import type {Request} from "express";
import {ConfigService} from "@nestjs/config";
import {getSessionMetadata} from "@/src/shared/utils/session-metadata.util";
import {RedisService} from "@/src/core/redis/redis.service";
import {destroySession, saveSession} from "@/src/shared/utils/session.util";
import {VerificationService} from "@/src/modules/auth/verification/verification.service";
import {TOTP} from "otpauth";
import {UserModel} from "@/src/modules/auth/account/models/user.model";
import {parseBoolean} from "@/src/shared/utils/parse-boolean.util";
import {ms, StringValue} from "@/src/shared/utils/ms.util";
import {TokenService} from "@/src/modules/auth/session/token.service";

@Injectable()
export class SessionService {
    public constructor(
        private readonly prismaService: PrismaService,
        private readonly configService: ConfigService,
        private readonly redisService: RedisService,
        private readonly verificationService: VerificationService,
        private readonly tokenService: TokenService,
    ) {}

    public async findByUser(req: Request) {
        const userId = req.session.userId ?? (req as any).jwtUserId;

        if (!userId) throw new NotFoundException('No user with this session');

        const records = await this.tokenService.findAllByUser(userId);

        // Map RefreshTokenRecord → SessionModel shape (reuse existing model)
        return records.map(r => ({
            id: r.tokenId,
            createdAt: r.createdAt,
            metadata: r.metadata,
            userId: r.userId,
        }));
    }

    public async findCurrent(req: Request) {
        const userId = req.session.userId ?? (req as any).jwtUserId;
        if (!userId) throw new UnauthorizedException();

        // tokenId attached to req by guard when using JWT
        const tokenId: string | undefined = (req as any).tokenId;

        if (tokenId) {
            const record = await this.tokenService.findOne(userId, tokenId);
            if (!record) throw new NotFoundException('Session not found');
            return {
                id: record.tokenId,
                createdAt: record.createdAt,
                metadata: record.metadata,
                userId: record.userId,
            };
        }

        // Fallback: web session
        const sessionFolder = this.configService.getOrThrow<string>('SESSION_FOLDER');
        const raw = await this.redisService.get(`${sessionFolder}${req.session.id}`);
        const session = JSON.parse(raw!);
        return { ...session, id: req.session.id };
    }

    public async login(req: Request, input: LoginInput, userAgent: string) {
        const {login, password, pin} = input;

        const user = await this.prismaService.user.findFirst({
            where: {
                OR: [
                    {username: {equals: login}},
                    {email: {equals: login}}
                ]
            }
        }) as UserModel;

        if (!user) throw new NotFoundException('Invalid login credentials');

        const isValidPassword = await verify(user.password, password);
        if (!isValidPassword) throw new UnauthorizedException('Passwords do not match');

        if (!user.isEmailVerified) {
            await this.verificationService.sendVerificationToken(user);
            throw new BadRequestException('Account not verified. Please check your email for confirmation');
        }

        if (user.isTotpEnabled) {
            if (!pin) {
                return { message: 'A code is required to complete the authorization' };
            }
            const totp = new TOTP({
                issuer: 'WG-Stream',
                label: `${user.email}`,
                algorithm: 'SHA1',
                digits: 6,
                secret: user.totpSecret,
            });
            const delta = totp.validate({token: pin});
            if (delta === null) throw new BadRequestException('Totp is invalid');
        }

        const metadata = getSessionMetadata(req, userAgent);
        // Save session (web) + issue JWT tokens (mobile)
        return saveSession(req, user, metadata, this.tokenService);
    }

    public async logout(req: Request) {
        // Revoke JWT refresh token if present
        const userId = req.session.userId ?? (req as any).jwtUserId;
        const tokenId: string | undefined = (req as any).tokenId;

        if (userId && tokenId) {
            await this.tokenService.revokeToken(userId, tokenId);
        }

        return destroySession(req, this.configService);
    }

    public async clearSession(req: Request) {
        req.res!.clearCookie(this.configService.getOrThrow<string>('SESSION_NAME'), {
            domain: this.configService.getOrThrow<string>('SESSION_DOMAIN'),
            maxAge: ms(this.configService.getOrThrow<StringValue>('SESSION_MAX_AGE')),
            httpOnly: parseBoolean(this.configService.getOrThrow<string>('SESSION_HTTP_ONLY')),
            secure: parseBoolean(this.configService.getOrThrow<string>('SESSION_SECURE')),
            sameSite: 'lax'
        });
        return true;
    }

    public async removeSession(req: Request, id: string) {
        const userId = req.session.userId ?? (req as any).jwtUserId;

        if (req.session.id === id || (req as any).tokenId === id) {
            throw new ConflictException('The current session cannot be deleted.');
        }

        await this.tokenService.revokeToken(userId, id);
        return true;
    }

    public async refresh(encodedRefreshToken: string) {
        return this.tokenService.refreshTokens(encodedRefreshToken);
    }
}
