import { Module } from '@nestjs/common';
import { StreamService } from './stream.service';
import { StreamResolver, StreamReferenceResolver } from './stream.resolver';
import { RecordingStorageService } from './recording-storage.service';

@Module({
    providers: [StreamResolver, StreamReferenceResolver, StreamService, RecordingStorageService],
})
export class StreamModule {}
