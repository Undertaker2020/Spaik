import { Directive, Field, ID, ObjectType } from '@nestjs/graphql';

// Reference stub — User is owned by the monolith subgraph. resolvable:false means
// this subgraph only references it (by id); the gateway resolves the rest.
@ObjectType()
@Directive('@key(fields: "id", resolvable: false)')
export class UserModel {
    @Field(() => ID)
    public id: string;
}
