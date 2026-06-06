import { Directive, Field, ID, ObjectType } from '@nestjs/graphql';
import { UserModel } from './user.model';
import { CategoryModel } from './category.model';

// Stream is owned by this subgraph (the @key entity); the monolith references it
// from UserModel.stream / CategoryModel.streams.
@ObjectType()
@Directive('@key(fields: "id")')
export class StreamModel {
    @Field(() => ID)
    public id: string;

    @Field(() => String)
    public title: string;

    @Field(() => String, { nullable: true })
    public thumbnailUrl: string;

    @Field(() => String, { nullable: true })
    public ingressId: string;

    @Field(() => String, { nullable: true })
    public serverUrl: string;

    @Field(() => String, { nullable: true })
    public streamKey: string;

    @Field(() => Boolean)
    public isLive: boolean;

    @Field(() => UserModel)
    public user: UserModel;

    @Field(() => String)
    public userId: string;

    @Field(() => CategoryModel, { nullable: true })
    public category: CategoryModel;

    @Field(() => String, { nullable: true })
    public categoryId: string;

    @Field(() => Boolean)
    public isChatEnabled: boolean;

    @Field(() => Boolean)
    public isChatFollowersOnly: boolean;

    @Field(() => Boolean)
    public isChatPremiumFollowersOnly: boolean;

    @Field(() => Date)
    public createdAt: Date;

    @Field(() => Date)
    public updatedAt: Date;
}
