import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

// A finished stream's recording, returned by findRecordingsByChannel. `url` is the
// object key within the MinIO recordings bucket — clients prepend their own
// recordings base URL (same convention as thumbnailUrl/avatar keys).
@ObjectType()
export class RecordingModel {
    @Field(() => ID)
    public id: string;

    @Field(() => String)
    public title: string;

    @Field(() => String)
    public url: string;

    @Field(() => String, { nullable: true })
    public thumbnailUrl: string;

    @Field(() => Int, { nullable: true })
    public duration: number;

    @Field(() => String)
    public userId: string;

    @Field(() => String, { nullable: true })
    public streamId: string;

    @Field(() => Date)
    public createdAt: Date;
}
