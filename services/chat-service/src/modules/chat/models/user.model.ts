import { Directive, Field, ID, ObjectType } from '@nestjs/graphql';

// Slim view of the user, scoped to what chat messages expose. Declared as a
// Federation 2 entity so the gateway merges the remaining User fields from the
// monolith subgraph. username/displayName/avatar are also owned by the monolith,
// so they are @shareable; standalone (subscriptions bypass the gateway) chat
// still resolves them inline from the shared DB.
@ObjectType()
@Directive('@key(fields: "id")')
export class UserModel {
    @Field(() => ID)
    public id: string;

    @Field(() => String)
    @Directive('@shareable')
    public username: string;

    @Field(() => String)
    @Directive('@shareable')
    public displayName: string;

    @Field(() => String, { nullable: true })
    @Directive('@shareable')
    public avatar: string | null;
}
