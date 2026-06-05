import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { MediaService } from './media.service';
import { Authorization } from '@/src/shared/auth/authorization.decorator';
import { Authorized } from '@/src/shared/auth/authorized.decorator';
import type { User } from '@prisma/generated';
import * as GraphQLUpload from 'graphql-upload/GraphQLUpload.js';
import * as Upload from 'graphql-upload/Upload.js';
import { FileValidationPipe } from '@/src/shared/pipes/file-validation.pipe';

@Resolver('Media')
export class MediaResolver {
    public constructor(private readonly mediaService: MediaService) {}

    // Ensures the subgraph has a Query root (GraphQL requires one).
    @Query(() => String, { name: 'mediaServiceStatus' })
    public status() {
        return 'ok';
    }

    @Authorization()
    @Mutation(() => Boolean, { name: 'changeProfileAvatar' })
    public async changeAvatar(
        @Authorized() user: User,
        @Args('avatar', { type: () => GraphQLUpload }, FileValidationPipe) avatar: Upload,
    ) {
        return this.mediaService.changeAvatar(user, avatar);
    }

    @Authorization()
    @Mutation(() => Boolean, { name: 'removeProfileAvatar' })
    public async removeAvatar(@Authorized() user: User) {
        return this.mediaService.removeAvatar(user);
    }

    @Authorization()
    @Mutation(() => Boolean, { name: 'changeStreamThumbnail' })
    public async changeThumbnail(
        @Authorized() user: User,
        @Args('thumbnail', { type: () => GraphQLUpload }, FileValidationPipe) thumbnail: Upload,
    ) {
        return this.mediaService.changeThumbnail(user, thumbnail);
    }

    @Authorization()
    @Mutation(() => Boolean, { name: 'removeStreamThumbnail' })
    public async removeThumbnail(@Authorized() user: User) {
        return this.mediaService.removeThumbnail(user);
    }
}
