import {Args, Mutation, Query, Resolver, Subscription} from '@nestjs/graphql';
import {Inject} from "@nestjs/common";
import {RedisPubSub} from "graphql-redis-subscriptions";
import {ChatService} from './chat.service';
import {ChatMessageModel} from "@/src/modules/chat/models/chat-message.model";
import {Authorization} from "@/src/shared/decorators/auth.decorator";
import {Authorized} from "@/src/shared/decorators/authorized.decorator";
import {User} from "@prisma/generated";
import {ChangeChatSettingsInput} from "@/src/modules/chat/inputs/change-chat-settings.input";
import {SendMessageInput} from "@/src/modules/chat/inputs/send-message.input";
import {PUB_SUB} from "@/src/modules/chat/pubsub/pubsub.provider";

@Resolver('Chat')
export class ChatResolver {
    public constructor(
        private readonly chatService: ChatService,
        @Inject(PUB_SUB) private readonly pubSub: RedisPubSub,
    ) {}

    @Query(() => [ChatMessageModel], {name: 'findChatMessagesByStream'})
    public async findMessagesByStream(@Args('streamId') streamId: string) {
        return this.chatService.findMessagesByStream(streamId);
    }

    @Authorization()
    @Mutation(() => Boolean, {name: "changeChatSettings"})
    public async changeSettings(
        @Authorized() user: User,
        @Args('data') input: ChangeChatSettingsInput
    ) {
        return this.chatService.changeSettings(user, input);
    }

    @Authorization()
    @Mutation(() => ChatMessageModel, {name: 'sendChatMessage'})
    public async sendMessage(
        @Authorized('id') userId: string,
        @Args('data') input: SendMessageInput
    ) {
        const message = await this.chatService.sendMessage(userId, input);

        await this.pubSub.publish('CHAT_MESSAGE_ADDED', {chatMessageAdded: message});

        return message;
    }

    @Subscription(() => ChatMessageModel, {
        name: 'chatMessageAdded', filter:
            (payload, variables) => payload.chatMessageAdded.streamId === variables.streamId
    })
    public chatMessageAdded(
        @Args('streamId') streamId: string,
    ) {
        return this.pubSub.asyncIterableIterator('CHAT_MESSAGE_ADDED');
    }
}
