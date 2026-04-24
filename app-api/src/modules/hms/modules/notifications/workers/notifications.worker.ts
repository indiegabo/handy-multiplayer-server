// src/core/notifications/workers/notifications.worker.ts
import {
    Inject,
    Injectable,
    OnModuleDestroy,
    OnModuleInit,
} from '@nestjs/common';
import {
    Job,
    Worker,
} from 'bullmq';
import { BetterLogger } from '../../better-logger/better-logger.service';
import { RedisService } from '../../redis/redis.service';
import { NotificationsRepository } from '../repositories/notifications.repository';
import { NotificationJobData } from '../types/notification-job-data.type';
import {
    NOTIFICATION_CHANNEL_DRIVERS,
    NotificationChannelDriver,
} from '../services/notifications.service';
import { NotificationChannel } from '../enums/notification-channel.enum';
import { NOTIFICATIONS_QUEUE_NAME } from '../queue/queue.constants';

/**
 * BullMQ worker that consumes the notifications queue
 * and performs the actual delivery using a channel driver.
 *
 * Flow:
 *  - mark SENDING (guard previous state)
 *  - driver.send()
 *  - mark SENT (+ DELIVERED / READ if hints say so)
 *  - on error, mark FAILED and let BullMQ retry/backoff
 *
 * Notes:
 * - The worker opens its own connections using the
 *   options from RedisService.getBullConnectionOptions().
 */
@Injectable()
export class NotificationsWorker implements OnModuleInit, OnModuleDestroy {

    private worker!: Worker<NotificationJobData>;

    constructor(
        private readonly repo: NotificationsRepository,
        private readonly redis: RedisService,
        private readonly logger: BetterLogger,
        @Inject(NOTIFICATION_CHANNEL_DRIVERS)
        private readonly drivers: NotificationChannelDriver[],
    ) {
        this.logger.setContext(NotificationsWorker.name);
    }

    async onModuleInit(): Promise<void> {
        const connection = this.redis.getBullConnectionOptions();

        this.worker = new Worker<NotificationJobData>(
            NOTIFICATIONS_QUEUE_NAME,
            (job) => this.process(job),
            { connection, concurrency: 16 },
        );

        this.worker.on('error', (err) => {
            this.logger.error(`Worker error: ${err?.message}`);
        });
    }

    async onModuleDestroy(): Promise<void> {
        try { if (this.worker) await this.worker.close(); } catch { }
    }

    /**
     * Pick a driver for the given channel.
     *
     * @param channel Notification channel.
     * @returns Matching driver or undefined.
     */
    private getDriver(
        channel: NotificationChannel,
    ): NotificationChannelDriver | undefined {
        return this.drivers.find(
            d => d.channel === channel,
        );
    }

    /**
     * Process a single job from the queue.
     *
     * @param job BullMQ job wrapper.
     * @returns Promise<void>
     */
    private async process(
        job: Job<NotificationJobData>,
    ): Promise<void> {
        const data = job.data;
        const driver = this.getDriver(data.channel);

        if (!driver) {
            await this.repo.markFailed(
                data.id,
                'NO_DRIVER',
                `No driver for ${data.channel}`,
            );
            this.logger.warn(
                `No driver for channel=${data.channel} ` +
                `id=${data.id}`,
            );
            return;
        }

        // Guard state: transition to SENDING
        const sending = await this.repo.markSending(
            data.id,
        );

        if (!sending) {
            // Another worker took it, or state changed.
            return;
        }

        try {
            const hints = await driver.send(sending);

            const sent = await this.repo.markSent(
                sending.id,
                hints?.sent_at ?? new Date(),
            );

            if (sent && hints?.delivered) {
                await this.repo.markDelivered(
                    sent.id,
                    hints?.delivered_at ?? new Date(),
                );
            }

            if (sent && hints?.read) {
                await this.repo.markRead(
                    sent.id,
                    hints?.read_at ?? new Date(),
                );
            }

            if (sent && (
                hints?.meta_patch ||
                hints?.external_id ||
                hints?.provider_response
            )) {
                await this.repo.update(
                    { id: sent.id },
                    {
                        meta: {
                            ...(sent.meta ?? {}),
                            ...(hints.meta_patch ?? {}),
                            external_id:
                                hints.external_id ??
                                (sent.meta as any)?.external_id,
                            provider_response:
                                hints.provider_response ??
                                (sent.meta as any)
                                    ?.provider_response,
                        } as any,
                    },
                );
            }
        } catch (err: any) {
            await this.repo.markFailed(
                sending.id,
                String(err?.code ?? 'SEND_ERROR'),
                String(err?.message ?? 'Unknown error'),
            );
            // Re-throw so BullMQ applies backoff/attempts
            throw err;
        }
    }
}
