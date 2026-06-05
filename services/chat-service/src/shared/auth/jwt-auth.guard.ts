import {
    type CanActivate,
    type ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';

interface TokenPayload {
    sub: string;
    tokenId: string;
}

// Stateless auth for the subgraph: verify the JWT access token issued by the
// monolith (shared JWT_SECRET). No session store, no DB lookup needed for the
// chat operations (they only require the user id).
@Injectable()
export class JwtAuthGuard implements CanActivate {
    public constructor(private readonly jwtService: JwtService) {}

    public canActivate(context: ExecutionContext): boolean {
        const ctx = GqlExecutionContext.create(context);
        const req = ctx.getContext().req;

        const authHeader: string | undefined = req?.headers?.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            throw new UnauthorizedException('Missing bearer token');
        }

        try {
            const payload = this.jwtService.verify<TokenPayload>(authHeader.slice(7));
            req.user = { id: payload.sub };
            req.tokenId = payload.tokenId;
            return true;
        } catch {
            throw new UnauthorizedException('Invalid or expired access token');
        }
    }
}
