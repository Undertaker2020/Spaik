import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/src/core/prisma/prisma.service';
import { FiltersInput } from '@/src/modules/stream/inputs/filters.input';
import type { Prisma, User } from '@prisma/generated';
import { ChangeStreamInfoInput } from '@/src/modules/stream/inputs/change-stream-info.input';
import { GenerateStreamTokenInput } from '@/src/modules/stream/inputs/generate-stream-token.input';
import { ConfigService } from '@nestjs/config';
import { AccessToken } from 'livekit-server-sdk';

@Injectable()
export class StreamService {
    public constructor(
        private readonly prismaService: PrismaService,
        private readonly configService: ConfigService,
    ) {}

    public async findAll(input: FiltersInput = {}) {
        const { take, skip, searchTerm, categoryName } = input;

        const where: Prisma.StreamWhereInput = {
            user: { isDeactivated: false },
            ...(searchTerm ? this.findBySearchTermFilter(searchTerm) : {}),
            ...(categoryName
                ? { category: { title: { equals: categoryName, mode: 'insensitive' } } }
                : {}),
        };

        return this.prismaService.stream.findMany({
            take: take ?? 12,
            skip: skip ?? 0,
            where,
            orderBy: { createdAt: 'desc' },
        });
    }

    public async findRandom(input: FiltersInput = {}) {
        const { categoryName } = input;

        const where: Prisma.StreamWhereInput = {
            user: { isDeactivated: false },
            ...(categoryName
                ? { category: { title: { equals: categoryName, mode: 'insensitive' } } }
                : {}),
        };

        const total = await this.prismaService.stream.count({ where });
        if (total === 0) return [];

        const pickCount = Math.min(4, total);
        const randomIndexes = new Set<number>();
        while (randomIndexes.size < pickCount) {
            randomIndexes.add(Math.floor(Math.random() * total));
        }

        const streams = await this.prismaService.stream.findMany({
            where,
            take: total,
            skip: 0,
        });

        return Array.from(randomIndexes).map(index => streams[index]);
    }

    public async changeInfo(user: User, input: ChangeStreamInfoInput) {
        const { title, categoryId } = input;

        await this.prismaService.stream.update({
            where: { userId: user.id },
            data: { title, category: { connect: { id: categoryId } } },
        });

        return true;
    }

    public async generateToken(input: GenerateStreamTokenInput) {
        const { userId, channelId } = input;

        let self: { id: string; username: string };

        const user = await this.prismaService.user.findUnique({ where: { id: userId } });

        if (user) {
            self = { id: user.id, username: user.username };
        } else {
            self = { id: userId, username: `Viewer ${Math.floor(Math.random() * 100000)}` };
        }

        const channel = await this.prismaService.user.findUnique({ where: { id: channelId } });
        if (!channel) {
            throw new NotFoundException('Channel does not exist');
        }

        const isHost = self.id === channel.id;

        const token = new AccessToken(
            this.configService.getOrThrow<string>('LIVEKIT_API_KEY'),
            this.configService.getOrThrow<string>('LIVEKIT_API_SECRET'),
            {
                // Identity must equal the channel/user id for the host so the
                // LiveKit room participant matches what the web player and the
                // ingress convention expect (web finds the publisher by
                // `participant.identity === channel.id`). No `Host-` prefix.
                identity: self.id.toString(),
                name: self.username,
            },
        );

        token.addGrant({
            room: channel.id,
            roomJoin: true,
            canPublish: isHost,
            canSubscribe: true,
        });

        return { token: token.toJwt() };
    }

    private findBySearchTermFilter(searchTerm: string): Prisma.StreamWhereInput {
        return {
            OR: [
                { title: { contains: searchTerm, mode: 'insensitive' } },
                { user: { username: { contains: searchTerm, mode: 'insensitive' } } },
                { category: { title: { contains: searchTerm, mode: 'insensitive' } } },
            ],
        };
    }
}
