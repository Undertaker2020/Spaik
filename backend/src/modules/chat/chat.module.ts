import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatResolver } from './chat.resolver';
import { PubSubProvider } from './pubsub/pubsub.provider';

@Module({
  providers: [ChatResolver, ChatService, PubSubProvider],
})
export class ChatModule {}
