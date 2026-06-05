import {
    Args,
    Mutation,
    Query,
    ResolveReference,
    Resolver,
    Subscription,
} from '@nestjs/graphql';
import { Inject } from '@nestjs/common';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { User } from '@prisma/generated';
import { ChatService } from './chat.service';
import { ChatMessageModel } from '@/src/modules/chat/models/chat-message.model';
import { UserModel } from '@/src/modules/chat/models/user.model';
import { Authorization } from '@/src/shared/auth/authorization.decorator';
import { Authorized } from '@/src/shared/auth/authorized.decorator';
import { ChangeChatSettingsInput } from '@/src/modules/chat/inputs/change-chat-settings.input';
import { SendMessageInput } from '@/src/modules/chat/inputs/send-message.input';
import { PUB_SUB } from '@/src/modules/chat/pubsub/pubsub.provider';
import { PrismaService } from '@/src/core/prisma/prisma.service';

@Resolver(() => ChatMessageModel)
export class ChatResolver {
    public constructor(
        private readonly chatService: ChatService,
        @Inject(PUB_SUB) private readonly pubSub: RedisPubSub,
    ) {}

    @Query(() => [ChatMessageModel], { name: 'findChatMessagesByStream' })
    public async findMessagesByStream(@Args('streamId') streamId: string) {
        return this.chatService.findMessagesByStream(streamId);
    }

    @Authorization()
    @Mutation(() => Boolean, { name: 'changeChatSettings' })
    public async changeSettings(
        @Authorized() user: User,
        @Args('data') input: ChangeChatSettingsInput,
    ) {
        return this.chatService.changeSettings(user, input);
    }

    @Authorization()
    @Mutation(() => ChatMessageModel, { name: 'sendChatMessage' })
    public async sendMessage(
        @Authorized('id') userId: string,
        @Args('data') input: SendMessageInput,
    ) {
        const message = await this.chatService.sendMessage(userId, input);

        await this.pubSub.publish('CHAT_MESSAGE_ADDED', { chatMessageAdded: message });

        return message;
    }

    @Subscription(() => ChatMessageModel, {
        name: 'chatMessageAdded',
        filter: (payload, variables) =>
            payload.chatMessageAdded.streamId === variables.streamId,
    })
    public chatMessageAdded(@Args('streamId') streamId: string) {
        return this.pubSub.asyncIterableIterator('CHAT_MESSAGE_ADDED');
    }
}

// Resolves the User entity when referenced by id (e.g. via a gateway).
// Standalone, the `user` field is already populated inline from the shared DB.
@Resolver(() => UserModel)
export class UserReferenceResolver {
    public constructor(private readonly prismaService: PrismaService) {}

    @ResolveReference()
    public resolveReference(reference: { __typename: string; id: string }) {
        return this.prismaService.user.findUnique({ where: { id: reference.id } });
    }
}
