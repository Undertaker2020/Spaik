import { Resolver, ResolveReference } from '@nestjs/graphql';
import { CategoryModel } from './models/category.model';
import { PrismaService } from '@/src/core/prisma/prisma.service';

// Resolves the Category entity when referenced by id from another subgraph
// (e.g. stream-service's Stream.category).
@Resolver(() => CategoryModel)
export class CategoryReferenceResolver {
    public constructor(private readonly prismaService: PrismaService) {}

    @ResolveReference()
    public resolveReference(reference: { __typename: string; id: string }) {
        return this.prismaService.category.findUnique({
            where: { id: reference.id },
        });
    }
}
