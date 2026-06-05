import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatResolver, UserReferenceResolver } from './chat.resolver';
import { PubSubProvider } from './pubsub/pubsub.provider';

@Module({
    providers: [ChatResolver, UserReferenceResolver, ChatService, PubSubProvider],
})
export class ChatModule {}
