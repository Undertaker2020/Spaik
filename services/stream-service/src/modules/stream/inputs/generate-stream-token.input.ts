import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType()
export class GenerateStreamTokenInput {
    @Field(() => String)
    @IsString()
    @IsNotEmpty()
    public userId: string;

    @Field(() => String)
    @IsString()
    @IsNotEmpty()
    public channelId: string;

    // Set only by the in-app broadcaster (go-live). Viewers — including the channel
    // owner watching their own stream — leave this false and get a unique viewer
    // identity, so they never collide with the publisher's identity (channel id).
    @Field(() => Boolean, { nullable: true })
    @IsOptional()
    @IsBoolean()
    public asHost?: boolean;
}
