import {type CanActivate, type ExecutionContext, Injectable, UnauthorizedException} from "@nestjs/common";
import {PrismaService} from "@/src/core/prisma/prisma.service";
import {GqlExecutionContext} from "@nestjs/graphql";
import {TokenService} from "@/src/modules/auth/session/token.service";

@Injectable()
export class GqlAuthGuard implements CanActivate {
    public constructor(
        private readonly prismaService: PrismaService,
        private readonly tokenService: TokenService,
    ) {}

    public async canActivate(context: ExecutionContext): Promise<boolean> {
        const ctx = GqlExecutionContext.create(context);
        const request = ctx.getContext().req;

        // 1. JWT bearer token (mobile clients)
        const authHeader: string | undefined = request.headers?.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            const payload = this.tokenService.verifyAccessToken(authHeader.slice(7));

            const user = await this.prismaService.user.findUnique({
                where: { id: payload.sub }
            });
            if (!user) throw new UnauthorizedException('User does not exist');

            request.user = user;
            request.jwtUserId = payload.sub;
            request.tokenId = payload.tokenId;

            return true;
        }

        // 2. Cookie session (web clients)
        if (typeof request.session.userId === "undefined") {
            throw new UnauthorizedException("User does not exist");
        }

        const user = await this.prismaService.user.findUnique({
            where: {
                id: request.session.userId
            }
        })

        request.user = user;

        return true
    }
}
