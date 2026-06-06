import {Injectable} from '@nestjs/common';
import {LivekitService} from "@/src/modules/libs/livekit/livekit.service";
import {PrismaService} from "@/src/core/prisma/prisma.service";
import {NotificationService} from "@/src/modules/notification/notification.service";
import {TelegramService} from "@/src/modules/libs/telegram/telegram.service";
import Stripe from "stripe";
import {TransactionStatus} from "@prisma/generated";
import {StripeService} from "@/src/modules/libs/stripe/stripe.service";
import {ConfigService} from "@nestjs/config";

@Injectable()
export class WebhookService {
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

            for(const follow of followers){
                const follower = follow.follower

                if(follower.notificationSettings?.siteNotifications) {
                    await this.notificationService.createStreamStart(follower.id, stream.user!)
                }

                if(follower.notificationSettings?.telegramNotifications && follower.telegramId) {
                    await this.telegramService.sendStreamStart(follower.id, stream.user!)
                }
            }
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
