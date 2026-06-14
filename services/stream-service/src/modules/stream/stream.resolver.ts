import {
    Args,
    Mutation,
    Parent,
    Query,
    ResolveField,
    ResolveReference,
    Resolver,
} from '@nestjs/graphql';
import { StreamService } from './stream.service';
import { StreamModel } from '@/src/modules/stream/models/stream.model';
import { UserModel } from '@/src/modules/stream/models/user.model';
import { CategoryModel } from '@/src/modules/stream/models/category.model';
import { GenerateStreamTokenModel } from '@/src/modules/stream/models/generate-stream-token.model';
import { RecordingModel } from '@/src/modules/stream/models/recording.model';
import { FiltersInput } from '@/src/modules/stream/inputs/filters.input';
import { ChangeStreamInfoInput } from '@/src/modules/stream/inputs/change-stream-info.input';
import { GenerateStreamTokenInput } from '@/src/modules/stream/inputs/generate-stream-token.input';
import { Authorization } from '@/src/shared/auth/authorization.decorator';
import { Authorized } from '@/src/shared/auth/authorized.decorator';
import type { Stream, User } from '@prisma/generated';
import { PrismaService } from '@/src/core/prisma/prisma.service';

@Resolver(() => StreamModel)
export class StreamResolver {
    public constructor(private readonly streamService: StreamService) {}

    @Query(() => [StreamModel], { name: 'findAllStreams' })
    public async findAll(@Args('filters') input: FiltersInput) {
        return this.streamService.findAll(input);
    }

    @Query(() => [StreamModel], { name: 'findRandomStreams' })
    public async findRandom(
        @Args('filters', { nullable: true, type: () => FiltersInput }) input?: FiltersInput,
    ) {
        return this.streamService.findRandom(input);
    }

    @Authorization()
    @Mutation(() => Boolean, { name: 'changeStreamInfo' })
    public async changeInfo(
        @Authorized() user: User,
        @Args('data') input: ChangeStreamInfoInput,
    ) {
        return this.streamService.changeInfo(user, input);
    }

    @Mutation(() => GenerateStreamTokenModel, { name: 'generateStreamToken' })
    public async generateStreamToken(@Args('data') input: GenerateStreamTokenInput) {
        return this.streamService.generateToken(input);
    }

    @Query(() => [RecordingModel], { name: 'findRecordingsByChannel' })
    public async findRecordingsByChannel(@Args('channelId') channelId: string) {
        return this.streamService.findRecordingsByChannel(channelId);
    }

    // Return entity references (by id) — the gateway resolves the rest from the
    // monolith subgraph (which owns User and Category).
    @ResolveField(() => UserModel)
    public user(@Parent() stream: Stream) {
        return { id: stream.userId };
    }

    @ResolveField(() => CategoryModel, { nullable: true })
    public category(@Parent() stream: Stream) {
        return stream.categoryId ? { id: stream.categoryId } : null;
    }
}

// Resolves the Stream entity by id when referenced from another subgraph
// (e.g. the monolith's UserModel.stream / CategoryModel.streams).
@Resolver(() => StreamModel)
export class StreamReferenceResolver {
    public constructor(private readonly prismaService: PrismaService) {}

    @ResolveReference()
    public resolveReference(reference: { __typename: string; id: string }) {
        return this.prismaService.stream.findUnique({ where: { id: reference.id } });
    }
}
