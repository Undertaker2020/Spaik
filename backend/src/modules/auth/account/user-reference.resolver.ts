import { Resolver, ResolveReference } from '@nestjs/graphql';
import { UserModel } from './models/user.model';
import { PrismaService } from '@/src/core/prisma/prisma.service';

// Resolves the User entity when the gateway references it by id from another
// subgraph (e.g. a chat message's author).
@Resolver(() => UserModel)
export class UserReferenceResolver {
    public constructor(private readonly prismaService: PrismaService) {}

    @ResolveReference()
    public resolveReference(reference: { __typename: string; id: string }) {
        return this.prismaService.user.findUnique({
            where: { id: reference.id },
        });
    }
}
