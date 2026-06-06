import {
    type CanActivate,
    type ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { resolveSessionUserId } from './session.util';

interface TokenPayload {
    sub: string;
    tokenId: string;
}

// Accepts BOTH auth schemes so web (cookie) and mobile (JWT) can call the service:
//  - Authorization: Bearer <access token>  → verified with the shared JWT_SECRET
//  - the monolith's express-session cookie  → resolved against the shared Redis
@Injectable()
export class JwtAuthGuard implements CanActivate {
    public constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {}

    public async canActivate(context: ExecutionContext): Promise<boolean> {
        const ctx = GqlExecutionContext.create(context);
        const req = ctx.getContext().req;

        const authHeader: string | undefined = req?.headers?.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            try {
                const payload = this.jwtService.verify<TokenPayload>(authHeader.slice(7));
                req.user = { id: payload.sub };
                req.tokenId = payload.tokenId;
                return true;
            } catch {
                throw new UnauthorizedException('Invalid or expired access token');
            }
        }

        const userId = await resolveSessionUserId(req, this.configService);
        if (!userId) throw new UnauthorizedException('Not authenticated');

        req.user = { id: userId };
        return true;
    }
}
