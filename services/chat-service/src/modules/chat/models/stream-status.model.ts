import { Field, ObjectType } from '@nestjs/graphql';

// Real-time live/offline status for a channel, pushed when the LiveKit webhook
// (in the monolith) flips a stream's isLive and publishes to the shared Redis
// channel. `channelId` is the stream owner's user id (room name === channel id).
@ObjectType()
export class StreamStatusModel {
    @Field(() => String)
    public channelId: string;

    @Field(() => Boolean)
    public isLive: boolean;
}
