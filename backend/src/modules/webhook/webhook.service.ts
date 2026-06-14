import {Injectable, Logger} from '@nestjs/common';
import {EncodedFileType} from "livekit-server-sdk";
import {LivekitService} from "@/src/modules/libs/livekit/livekit.service";
import {PrismaService} from "@/src/core/prisma/prisma.service";
import {NotificationService} from "@/src/modules/notification/notification.service";
import {TelegramService} from "@/src/modules/libs/telegram/telegram.service";
import Stripe from "stripe";
import {TransactionStatus, type Stream, type User} from "@prisma/generated";
import {StripeService} from "@/src/modules/libs/stripe/stripe.service";
import {ConfigService} from "@nestjs/config";

@Injectable()
export class WebhookService {
    private readonly logger = new Logger(WebhookService.name);

    public constructor(
        private readonly prismaService: PrismaService,
        private readonly livekitService: LivekitService,
        private readonly notificationService: NotificationService,
        private readonly telegramService: TelegramService,
        private readonly stripeService: StripeService,
        private readonly configService: ConfigService,
    ) {
    }

    public async receiveWebhookLivekit(body: string, authorization: string) {
        // Parse the raw LiveKit webhook JSON directly. Signature verification is
        // skipped in dev; the SDK's WebhookReceiver.fromJSON (protobuf) is too
        // strict for the event shape we need (event.event / ingressInfo.ingressId).
        const event: any = typeof body === 'string' ? JSON.parse(body) : body;

        if (event.event === 'ingress_started') {
            const stream = await this.prismaService.stream.findUnique({
                where: {
                    ingressId: event.ingressInfo?.ingressId
                },
                include: {
                    user: true
                }
            })

            if (!stream) return;

            await this.prismaService.stream.update({
                where: { id: stream.id },
                data: { isLive: true }
            })

            await this.notifyFollowersStreamStart(stream)
            await this.startRecording(stream)
        }

        // Direct in-app broadcasting (no ingress): the host joins the LiveKit room
        // with a `Host-<userId>` identity (room name == userId) and publishes a
        // track. Mirror ingress_started/ended so isLive + notifications + chat
        // cleanup work for mobile/web publishing too.
        if (event.event === 'track_published' && this.isHostPublisher(event)) {
            const stream = await this.prismaService.stream.findUnique({
                where: { userId: event.room?.name },
                include: { user: true }
            })

            // Idempotent: the host publishes camera + mic, so this fires twice.
            if (!stream || stream.isLive) return;

            await this.prismaService.stream.update({
                where: { id: stream.id },
                data: { isLive: true }
            })

            await this.notifyFollowersStreamStart(stream)
            await this.startRecording(stream)
        }

        if (event.event === 'participant_left' && this.isHostPublisher(event)) {
            const stream = await this.prismaService.stream.findUnique({
                where: { userId: event.room?.name }
            })

            if (!stream) return;

            await this.prismaService.stream.update({
                where: { id: stream.id },
                data: { isLive: false }
            })

            await this.prismaService.chatMessage.deleteMany({
                where: { streamId: stream.id }
            })
        }

        if (event.event === 'ingress_ended') {
            const stream = await this.prismaService.stream.findUnique({
                where: {
                    ingressId: event.ingressInfo?.ingressId
                }
            })

            if (!stream) return;

            await this.prismaService.stream.update({
                where: { id: stream.id },
                data: { isLive: false }
            })

            await this.prismaService.chatMessage.deleteMany({
                where: {
                    streamId: stream.id
                }
            })
        }

        // Participant egress finished uploading the MP4 to MinIO — persist it as a
        // recording on the channel. Egress auto-stops when the host leaves, so this
        // fires after the stream ends.
        if (event.event === 'egress_ended') {
            const info = event.egressInfo;
            const roomName = info?.roomName; // === the channel owner's user id

            const fileResult = info?.fileResults?.[0] ?? info?.file;
            const key = fileResult?.filename; // object key within the recordings bucket

            if (!roomName || !key) return;

            const stream = await this.prismaService.stream.findUnique({
                where: { userId: roomName }
            })

            if (!stream || !stream.userId) return;

            // LiveKit reports duration in nanoseconds (string) — store whole seconds.
            const durationNs = fileResult?.duration;
            const duration = durationNs ? Math.round(Number(durationNs) / 1e9) : null;

            await this.prismaService.recording.create({
                data: {
                    title: stream.title,
                    url: key,
                    thumbnailUrl: stream.thumbnailUrl,
                    duration,
                    userId: stream.userId,
                    streamId: stream.id
                }
            })
        }
    }

    // Record the host's published track (participant egress, identity === room ===
    // userId) to an MP4 in the MinIO recordings bucket. Best-effort: egress errors
    // must never block the stream from going live.
    private async startRecording(stream: { userId: string | null }) {
        if (!stream.userId) return;

        try {
            // Idempotent: a reconnecting publisher can re-fire go-live, so don't
            // start a second recording if one is already running for this room.
            const active = await this.livekitService.egress.listEgress({
                roomName: stream.userId,
                active: true
            })
            if (active.length > 0) return;

            await this.livekitService.egress.startParticipantEgress(
                stream.userId,
                stream.userId,
                {
                    file: {
                        fileType: EncodedFileType.MP4,
                        filepath: `${stream.userId}/${Date.now()}.mp4`,
                        disableManifest: true,
                        s3: this.egressS3()
                    }
                }
            )
        } catch (error) {
            this.logger.error('Failed to start participant egress', error as Error)
        }
    }

    // MinIO/S3 upload target for egress. The egress container reaches MinIO over
    // the docker network, so the endpoint is the internal service name, not localhost.
    private egressS3() {
        const cfg = this.configService;
        return {
            endpoint: cfg.get<string>('LIVEKIT_EGRESS_S3_ENDPOINT') ?? 'http://minio:9000',
            bucket: cfg.get<string>('LIVEKIT_EGRESS_S3_BUCKET') ?? 'spaik-recordings',
            accessKey: cfg.get<string>('LIVEKIT_EGRESS_S3_ACCESS_KEY') ?? 'spaik_admin',
            secret: cfg.get<string>('LIVEKIT_EGRESS_S3_SECRET') ?? 'spaik_password_123',
            region: cfg.get<string>('LIVEKIT_EGRESS_S3_REGION') ?? 'us-east-1',
            forcePathStyle: true
        };
    }

    // The host publishes with identity === the room name (the channel owner's
    // user id) — same convention as the ingress participant. Viewers can't
    // publish, so this reliably distinguishes the broadcaster.
    private isHostPublisher(event: any): boolean {
        const identity = event.participant?.identity;
        const room = event.room?.name;
        return typeof identity === 'string' && !!room && identity === room;
    }

    private async notifyFollowersStreamStart(stream: Stream & { user: User | null }) {
        const followers = await this.prismaService.follow.findMany({
            where: {
                followingId: stream.user?.id,
                follower: {
                    isDeactivated: false
                }
            },
            include: {
                follower: {
                    include: {
                        notificationSettings: true
                    }
                }
            }
        })

        for (const follow of followers) {
            const follower = follow.follower

            if (follower.notificationSettings?.siteNotifications) {
                await this.notificationService.createStreamStart(follower.id, stream.user!)
            }

            if (follower.notificationSettings?.telegramNotifications && follower.telegramId) {
                await this.telegramService.sendStreamStart(follower.id, stream.user!)
            }
        }
    }

    public async receiveWebhookStripe(event: Stripe.Event) {
        const session = event.data.object as Stripe.Checkout.Session;

        if (event.type === "checkout.session.completed") {
            const planId = session.metadata!.planId;
            const userId = session.metadata!.userId;
            const channelId = session.metadata!.channelId;

            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 30)

            const sponsorshipSubscription = await this.prismaService.sponsorshipSubscription.create({
                data: {
                    expiresAt,
                    planId,
                    userId,
                    channelId
                },
                include: {
                    plan: true,
                    user: true,
                    channel: {
                        include: {
                            notificationSettings: true
                        }
                    }
                }
            })

            await this.prismaService.transaction.updateMany({
                where: {
                    stripeSubscriptionId: session.id,
                    status: TransactionStatus.PENDING
                },
                data: {
                    status: TransactionStatus.SUCCESS
                }
            })

            if (sponsorshipSubscription.channel?.notificationSettings?.siteNotifications) {
                await this.notificationService.createNewSponsorship(
                    sponsorshipSubscription.channel.id,
                    sponsorshipSubscription.plan!,
                    sponsorshipSubscription.user!
                )
            }

            if (sponsorshipSubscription.channel?.notificationSettings?.telegramNotifications &&
                sponsorshipSubscription.channel.telegramId) {
                await this.telegramService.sendNewSponsorship(
                    sponsorshipSubscription.channel.telegramId,
                    sponsorshipSubscription.plan!,
                    sponsorshipSubscription.user!
                )
            }
        }

        if (event.type === "checkout.session.expired") {
            await this.prismaService.transaction.updateMany({
                where: {
                    stripeSubscriptionId: session.id
                },
                data: {
                    status: TransactionStatus.EXPIRED
                }
            })
        }

        if (event.type === "checkout.session.async_payment_failed") {
            await this.prismaService.transaction.updateMany({
                where: {
                    stripeSubscriptionId: session.id
                },
                data: {
                    status: TransactionStatus.FAILED
                }
            })
        }
    }

    public constructorStripeEvent(payload: any, signature: any) {
        return this.stripeService.webhooks.constructEvent(
            payload,
            signature,
            this.configService.getOrThrow<string>('STRIPE_WEBHOOK_SECRET')
        )
    }
}
