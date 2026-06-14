import { Injectable, Logger } from '@nestjs/common';
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

// Deletes recording objects from the MinIO recordings bucket. This service runs
// on the host, so the S3 endpoint is localhost (not the docker-internal name the
// egress container uses). Defaults match docker-compose; override via env.
@Injectable()
export class RecordingStorageService {
    private readonly logger = new Logger(RecordingStorageService.name);
    private readonly client: S3Client;
    private readonly bucket: string;

    public constructor(private readonly configService: ConfigService) {
        const cfg = this.configService;
        this.client = new S3Client({
            endpoint: cfg.get<string>('S3_ENDPOINT') ?? 'http://localhost:9000',
            region: cfg.get<string>('S3_REGION') ?? 'us-east-1',
            credentials: {
                accessKeyId: cfg.get<string>('S3_ACCESS_KEY_ID') ?? 'spaik_admin',
                secretAccessKey: cfg.get<string>('S3_SECRET') ?? 'spaik_password_123',
            },
            forcePathStyle: true,
        });
        this.bucket = cfg.get<string>('S3_RECORDINGS_BUCKET') ?? 'spaik-recordings';
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
