import {
    type CanActivate,
    type ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/src/core/prisma/prisma.service';
import { resolveSessionUserId } from './session.util';

interface TokenPayload {
    sub: string;
    tokenId: string;
}

// Accepts BOTH auth schemes so web (cookie) and mobile (JWT) can call the service:
//  - Authorization: Bearer <access token>  → verified with the shared JWT_SECRET
//  - the monolith's express-session cookie  → resolved against the shared Redis
// Loads the full user (mutations need username/avatar for storage keys).
@Injectable()
export class JwtAuthGuard implements CanActivate {
    public constructor(
        private readonly jwtService: JwtService,
        private readonly prismaService: PrismaService,
        private readonly configService: ConfigService,
    ) {}

    public async canActivate(context: ExecutionContext): Promise<boolean> {
        const ctx = GqlExecutionContext.create(context);
        const req = ctx.getContext().req;

        let userId: string | null = null;

        const authHeader: string | undefined = req?.headers?.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            try {
                const payload = this.jwtService.verify<TokenPayload>(authHeader.slice(7));
                userId = payload.sub;
            } catch {
                throw new UnauthorizedException('Invalid or expired access token');
            }
        } else {
            userId = await resolveSessionUserId(req, this.configService);
        }

        if (!userId) throw new UnauthorizedException('Not authenticated');

        const user = await this.prismaService.user.findUnique({ where: { id: userId } });
        if (!user) throw new UnauthorizedException('User does not exist');

        req.user = user;
        return true;
    }
}
