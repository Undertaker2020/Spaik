import { Field, ID, ObjectType } from '@nestjs/graphql';
import { UserModel } from './user.model';

@ObjectType()
export class ChatMessageModel {
    @Field(() => ID)
    public id: string;

    @Field(() => String)
    public text: string;

    @Field(() => UserModel)
    public user: UserModel;

    @Field(() => String)
    public userId: string;

    @Field(() => String)
    public streamId: string;

    @Field(() => Date)
    public createdAt: Date;

    @Field(() => Date)
    public updatedAt: Date;
}
