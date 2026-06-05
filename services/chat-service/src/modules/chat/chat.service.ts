import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/src/core/prisma/prisma.service';
import { SendMessageInput } from '@/src/modules/chat/inputs/send-message.input';
import { ChangeChatSettingsInput } from '@/src/modules/chat/inputs/change-chat-settings.input';
import { User } from '@prisma/generated';

@Injectable()
export class ChatService {
    public constructor(private readonly prismaService: PrismaService) {}

    public async findMessagesByStream(streamId: string) {
        return this.prismaService.chatMessage.findMany({
            where: { streamId },
            orderBy: { createdAt: 'desc' },
            include: { user: true },
        });
    }

    public async sendMessage(userId: string, input: SendMessageInput) {
        const { text, streamId } = input;

        const stream = await this.prismaService.stream.findUnique({
            where: { id: streamId },
        });

        if (!stream) {
            throw new NotFoundException('Stream not found');
        }

        if (!stream.isLive) {
            throw new BadRequestException('Stream not live');
        }

        return this.prismaService.chatMessage.create({
            data: {
                text,
                user: { connect: { id: userId } },
                stream: { connect: { id: streamId } },
            },
            include: { user: true },
        });
    }

    public async changeSettings(user: User, input: ChangeChatSettingsInput) {
        const { isChatEnabled, isChatFollowersOnly, isChatPremiumFollowersOnly } = input;

        await this.prismaService.stream.update({
            where: { userId: user.id },
            data: {
                isChatEnabled,
                isChatFollowersOnly,
                isChatPremiumFollowersOnly,
            },
        });

        return true;
    }
}
