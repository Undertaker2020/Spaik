import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@/src/core/prisma/prisma.service';
import { StorageService } from '@/src/modules/storage/storage.service';
import type { User } from '@prisma/generated';
import * as Upload from 'graphql-upload/Upload.js';
import * as sharp from 'sharp';

@Injectable()
export class MediaService {
    public constructor(
        private readonly prismaService: PrismaService,
        private readonly storageService: StorageService,
    ) {}

    public async changeAvatar(user: User, file: Upload) {
        if (user.avatar) {
            await this.storageService.remove(user.avatar);
        }

        const buffer = await this.toWebp(file, 512, 512);
        const fileName = `channels/${user.username}.webp`;

        await this.storageService.upload(buffer, fileName, 'image/webp');

        await this.prismaService.user.update({
            where: { id: user.id },
            data: { avatar: `/${fileName}` },
        });

        return true;
    }

    public async removeAvatar(user: User) {
        if (!user.avatar) return true;

        await this.storageService.remove(user.avatar);

        await this.prismaService.user.update({
            where: { id: user.id },
            data: { avatar: null },
        });

        return true;
    }

    public async changeThumbnail(user: User, file: Upload) {
        const stream = await this.findStream(user);

        if (stream.thumbnailUrl) {
            await this.storageService.remove(stream.thumbnailUrl);
        }

        const buffer = await this.toWebp(file, 1280, 720);
        const fileName = `/streams/${user.username}.webp`;

        await this.storageService.upload(buffer, fileName, 'image/webp');

        await this.prismaService.stream.update({
            where: { userId: user.id },
            data: { thumbnailUrl: fileName },
        });

        return true;
    }

    public async removeThumbnail(user: User) {
        const stream = await this.findStream(user);

        if (!stream.thumbnailUrl) return true;

        await this.storageService.remove(stream.thumbnailUrl);

        await this.prismaService.stream.update({
            where: { userId: user.id },
            data: { thumbnailUrl: null },
        });

        return true;
    }

    // ── Helpers ───────────────────────────────────────────────

    private async toWebp(file: Upload, width: number, height: number): Promise<Buffer> {
        const chunks: Buffer[] = [];
        for await (const chunk of file.createReadStream()) {
            chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        return sharp(buffer, { animated: true }).resize(width, height).webp().toBuffer();
    }

    private async findStream(user: User) {
        const stream = await this.prismaService.stream.findUnique({
            where: { userId: user.id },
        });

        if (!stream) {
            throw new BadRequestException('Unable to find stream');
        }

        return stream;
    }
}
