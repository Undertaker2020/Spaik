import {
    type CanActivate,
    type ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/src/core/prisma/prisma.service';

interface TokenPayload {
    sub: string;
    tokenId: string;
}

// Verifies the monolith-issued JWT (shared JWT_SECRET) and loads the full user
// — the media mutations need username/avatar for storage keys and cleanup.
@Injectable()
export class JwtAuthGuard implements CanActivate {
    public constructor(
        private readonly jwtService: JwtService,
        private readonly prismaService: PrismaService,
    ) {}

    public async canActivate(context: ExecutionContext): Promise<boolean> {
        const ctx = GqlExecutionContext.create(context);
        const req = ctx.getContext().req;

        const authHeader: string | undefined = req?.headers?.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            throw new UnauthorizedException('Missing bearer token');
        }

        let payload: TokenPayload;
        try {
            payload = this.jwtService.verify<TokenPayload>(authHeader.slice(7));
        } catch {
            throw new UnauthorizedException('Invalid or expired access token');
        }

        const user = await this.prismaService.user.findUnique({
            where: { id: payload.sub },
        });
        if (!user) throw new UnauthorizedException('User does not exist');

        req.user = user;
        return true;
    }
}
