import { Directive, Field, ID, ObjectType } from '@nestjs/graphql';

// Slim view of the user, scoped to what chat messages expose. Declared as a
// Federation 2 entity so a gateway can later merge the remaining User fields
// from the monolith subgraph; standalone it resolves inline from the shared DB.
@ObjectType()
@Directive('@key(fields: "id")')
export class UserModel {
    @Field(() => ID)
    public id: string;

    @Field(() => String)
    public username: string;

    @Field(() => String)
    public displayName: string;

    @Field(() => String, { nullable: true })
    public avatar: string | null;
}
