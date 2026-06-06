import {Directive, Field, ID, ObjectType} from "@nestjs/graphql";

// Reference stub — Stream is owned by the stream-service subgraph. The monolith
// only references it (by id) from UserModel.stream / CategoryModel.streams; the
// gateway resolves the rest from stream-service. resolvable:false = "I don't own it".
@ObjectType()
@Directive('@key(fields: "id", resolvable: false)')
export class StreamModel {
    @Field(() => ID)
    public id: string;
}
