// src/hms/modules/notifications/queue/notifications.queue.ts
import {
    Injectable,
    OnModuleDestroy,
    OnModuleInit,
} from '@nestjs/common';
import { JobsOptions, Queue, QueueEvents } from 'bullmq';
import { BetterLogger } from '../../better-logger/better-logger.service';
import { RedisService } from '../../redis/redis.service';
import { NotificationJobData } from '../types/notification-job-data.type';
import { NOTIFICATIONS_QUEUE_NAME } from './queue.constants';

@Injectable()
export class NotificationsQueue
    implements OnModuleInit, OnModuleDestroy {

    // use a valid queue name (no colon)
    public readonly name = NOTIFICATIONS_QUEUE_NAME;

    private queue!: Queue<NotificationJobData>;
    private events!: QueueEvents;

    constructor(
        private readonly redis: RedisService,
        private readonly logger: BetterLogger,
    ) {
        this.logger.setContext(NotificationsQueue.name);
    }

    async onModuleInit(): Promise<void> {
        const connection = this.redis.getBullConnectionOptions();

        this.queue = new Queue<NotificationJobData>(
            this.name,
            { connection },
        );

        this.events = new QueueEvents(
            this.name,
            { connection },
        );

        this.events.on('failed', (evt) => {
            this.logger.warn(
                `Queue failed jobId=${evt.jobId} reason=${evt.failedReason}`,
            );
        });

        this.events.on('completed', (evt) => {
            this.logger.debug(`Queue completed jobId=${evt.jobId}`);
        });
    }

    async onModuleDestroy(): Promise<void> {
        try { if (this.events) await this.events.close(); } catch { }
        try { if (this.queue) await this.queue.close(); } catch { }
    }

    async enqueue(
        data: NotificationJobData,
        opts?: Partial<JobsOptions>,
    ): Promise<void> {
        await this.queue.add(
            'emit',
            data,
            {
                jobId: data.id,
                removeOnComplete: 1000,
                removeOnFail: 1000,
                attempts: 5,
                backoff: { type: 'exponential', delay: 1000 },
                ...(opts ?? {}),
            },
        );
    }
}
