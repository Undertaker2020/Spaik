import { Module } from '@nestjs/common';
import { StreamService } from './stream.service';
import { StreamResolver, StreamReferenceResolver } from './stream.resolver';

@Module({
    providers: [StreamResolver, StreamReferenceResolver, StreamService],
})
export class StreamModule {}
