import { Directive, Field, ID, ObjectType } from '@nestjs/graphql';

// Reference stub — Category is owned by the monolith subgraph.
@ObjectType()
@Directive('@key(fields: "id", resolvable: false)')
export class CategoryModel {
    @Field(() => ID)
    public id: string;
}
