import { Injectable, Logger } from '@nestjs/common';
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

// Deletes recording objects from the MinIO recordings bucket (configured via
// S3_* env). This service runs on the host, so S3_ENDPOINT is localhost (not the
// docker-internal name the egress container uses).
@Injectable()
export class RecordingStorageService {
    private readonly logger = new Logger(RecordingStorageService.name);
    private readonly client: S3Client;
    private readonly bucket: string;

    public constructor(private readonly configService: ConfigService) {
        const cfg = this.configService;
        this.client = new S3Client({
            endpoint: cfg.getOrThrow<string>('S3_ENDPOINT'),
            region: cfg.getOrThrow<string>('S3_REGION'),
            credentials: {
                accessKeyId: cfg.getOrThrow<string>('S3_ACCESS_KEY_ID'),
                secretAccessKey: cfg.getOrThrow<string>('S3_SECRET'),
            },
            forcePathStyle: true,
        });
        this.bucket = cfg.getOrThrow<string>('S3_RECORDINGS_BUCKET');
    }

    public async remove(key: string) {
        try {
            await this.client.send(
                new DeleteObjectCommand({
                    Bucket: this.bucket,
                    Key: key.replace(/^\/+/, ''),
                }),
            );
        } catch (error) {
            // Best-effort: a missing/unreachable object shouldn't block deleting the row.
            this.logger.error(`Failed to remove recording object ${key}`, error as Error);
        }
    }
}
