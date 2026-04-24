// notifications.repository.ts
import {
    Injectable,
} from '@nestjs/common';
import {
    DataSource,
    Repository,
    FindOptionsWhere,
    In,
    SelectQueryBuilder,
} from 'typeorm';
import { NotificationChannel } from '../enums/notification-channel.enum';
import { NotificationStatus } from '../enums/notification-status.enum';
import { HmsNotification } from '../entities/notifications.entity';
import { EnqueueNotificationInput } from '../types/enqueue-notification-input.type';
import { NotificationSearchFilter } from '../types/notifications-search-filter.type';
import { PaginationOptions } from '../types/pagination-options.type';

@Injectable()
export class NotificationsRepository
    extends Repository<HmsNotification> {

    constructor(
        private readonly dataSource: DataSource,
    ) {
        super(
            HmsNotification,
            dataSource.createEntityManager(),
        );
    }

    /**
     * Enqueue a new notification with status "queued"
     * (or "scheduled" if scheduled_at is provided in the future).
     */
    async enqueue(
        input: EnqueueNotificationInput,
    ): Promise<HmsNotification> {
        const {
            scheduled_at,
        } = input;

        const status =
            scheduled_at &&
                scheduled_at.getTime() > Date.now()
                ? NotificationStatus.SCHEDULED
                : NotificationStatus.QUEUED;

        const entity = this.create({
            ...input,
            status,
        });

        return await this.save(entity);
    }

    /**
     * Find notifications by polymorphic "notifiable".
     */
    async findByNotifiable(
        notifiable_type: string,
        notifiable_id: string,
        options?: {
            limit?: number;
            offset?: number;
        },
    ): Promise<HmsNotification[]> {
        const limit = options?.limit ?? 50;
        const offset = options?.offset ?? 0;

        return await this.find({
            where: {
                notifiable_type,
                notifiable_id,
            },
            order: { created_at: 'DESC' },
            take: limit,
            skip: offset,
        });
    }

    /**
     * Find scheduled notifications that are due at or before "until".
     * Useful for schedulers to promote them to "queued" or "sending".
     */
    async findScheduledDue(
        until: Date,
        limit: number = 100,
    ): Promise<HmsNotification[]> {
        return await this.createQueryBuilder('n')
            .where('n.status = :status', {
                status: NotificationStatus.SCHEDULED,
            })
            .andWhere('n.scheduled_at IS NOT NULL')
            .andWhere('n.scheduled_at <= :until', { until })
            .orderBy('n.scheduled_at', 'ASC')
            .limit(limit)
            .getMany();
    }

    /**
     * Find notifications pending for a channel:
     * queued or sending (not yet sent).
     */
    async findPendingByChannel(
        channel: NotificationChannel,
        limit: number = 100,
    ): Promise<HmsNotification[]> {
        return await this.createQueryBuilder('n')
            .where('n.channel = :channel', { channel })
            .andWhere('n.status IN (:...statuses)', {
                statuses: [
                    NotificationStatus.QUEUED,
                    NotificationStatus.SENDING,
                ],
            })
            .orderBy('n.queued_at', 'ASC')
            .limit(limit)
            .getMany();
    }

    /**
     * Transition to "sending".
     * Optionally guard the transition by current statuses.
     */
    async markSending(
        id: string,
        allowFrom: NotificationStatus[] = [
            NotificationStatus.QUEUED,
            NotificationStatus.SCHEDULED,
        ],
    ): Promise<HmsNotification | null> {
        const qb = this.createQueryBuilder()
            .update(HmsNotification)
            .set({
                status: NotificationStatus.SENDING,
            })
            .where('id = :id', { id });

        if (allowFrom?.length > 0) {
            qb.andWhere('status IN (:...allowFrom)', { allowFrom });
        }

        const res = await qb
            .returning('*')
            .execute();

        return (res.raw?.[0] as HmsNotification) ?? null;
    }

    /**
     * Transition to "sent".
     */
    async markSent(
        id: string,
        sentAt: Date = new Date(),
        allowFrom: NotificationStatus[] = [
            NotificationStatus.SENDING,
            NotificationStatus.QUEUED,
        ],
    ): Promise<HmsNotification | null> {
        const qb = this.createQueryBuilder()
            .update(HmsNotification)
            .set({
                status: NotificationStatus.SENT,
                sent_at: sentAt,
            })
            .where('id = :id', { id });

        if (allowFrom?.length > 0) {
            qb.andWhere('status IN (:...allowFrom)', { allowFrom });
        }

        const res = await qb
            .returning('*')
            .execute();

        return (res.raw?.[0] as HmsNotification) ?? null;
    }

    /**
     * Transition to "delivered".
     */
    async markDelivered(
        id: string,
        deliveredAt: Date = new Date(),
        allowFrom: NotificationStatus[] = [
            NotificationStatus.SENT,
            NotificationStatus.SENDING,
        ],
    ): Promise<HmsNotification | null> {
        const qb = this.createQueryBuilder()
            .update(HmsNotification)
            .set({
                status: NotificationStatus.DELIVERED,
                delivered_at: deliveredAt,
            })
            .where('id = :id', { id });

        if (allowFrom?.length > 0) {
            qb.andWhere('status IN (:...allowFrom)', { allowFrom });
        }

        const res = await qb
            .returning('*')
            .execute();

        return (res.raw?.[0] as HmsNotification) ?? null;
    }

    /**
     * Transition to "read".
     */
    async markRead(
        id: string,
        readAt: Date = new Date(),
        allowFrom: NotificationStatus[] = [
            NotificationStatus.DELIVERED,
            NotificationStatus.SENT,
        ],
    ): Promise<HmsNotification | null> {
        const qb = this.createQueryBuilder()
            .update(HmsNotification)
            .set({
                status: NotificationStatus.READ,
                read_at: readAt,
            })
            .where('id = :id', { id });

        if (allowFrom?.length > 0) {
            qb.andWhere('status IN (:...allowFrom)', { allowFrom });
        }

        const res = await qb
            .returning('*')
            .execute();

        return (res.raw?.[0] as HmsNotification) ?? null;
    }

    /**
     * Transition to "failed".
     */
    async markFailed(
        id: string,
        error_code?: string | null,
        error_message?: string | null,
        failedAt: Date = new Date(),
        allowFrom: NotificationStatus[] = [
            NotificationStatus.QUEUED,
            NotificationStatus.SENDING,
            NotificationStatus.SENT,
            NotificationStatus.DELIVERED,
        ],
    ): Promise<HmsNotification | null> {
        const qb = this.createQueryBuilder()
            .update(HmsNotification)
            .set({
                status: NotificationStatus.FAILED,
                error_code: error_code ?? null,
                error_message: error_message ?? null,
                failed_at: failedAt,
            })
            .where('id = :id', { id });

        if (allowFrom?.length > 0) {
            qb.andWhere('status IN (:...allowFrom)', { allowFrom });
        }

        const res = await qb
            .returning('*')
            .execute();

        return (res.raw?.[0] as HmsNotification) ?? null;
    }

    /**
     * Promote due scheduled notifications to "queued".
     * Returns the updated rows.
     */
    async promoteDueScheduledToQueued(
        until: Date = new Date(),
        limit: number = 200,
    ): Promise<HmsNotification[]> {
        // Note: PostgreSQL-only RETURNING with LIMIT pattern via CTE.
        const query = `
            WITH cte AS (
                SELECT id
                FROM hms_notifications
                WHERE status = $1
                AND scheduled_at IS NOT NULL
                AND scheduled_at <= $2
                ORDER BY scheduled_at ASC
                LIMIT $3
                FOR UPDATE
                SKIP LOCKED
            )
            UPDATE hms_notifications n
            SET status = $4
            FROM cte
            WHERE n.id = cte.id
            RETURNING n.*;
        `;

        const rows = await this.query(
            query,
            [
                NotificationStatus.SCHEDULED,
                until,
                limit,
                NotificationStatus.QUEUED,
            ],
        );

        return rows as HmsNotification[];
    }

    /**
     * Counts grouped by status, optionally filtered by channel.
     */
    async getCountsByStatus(
        channel?: NotificationChannel,
    ): Promise<Record<NotificationStatus, number>> {
        const qb = this.createQueryBuilder('n')
            .select('n.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .groupBy('n.status');

        if (channel) {
            qb.where('n.channel = :channel', { channel });
        }

        const rows = await qb.getRawMany<{
            status: NotificationStatus;
            count: string;
        }>();

        const result = Object.values(NotificationStatus)
            .reduce((acc, s) => {
                acc[s] = 0;
                return acc;
            }, {} as Record<NotificationStatus, number>);

        for (const r of rows) {
            result[r.status] = Number(r.count) || 0;
        }

        return result;
    }

    /**
     * Flexible search with pagination and basic full-text
     * (ILIKE on subject/body).
     */
    async search(
        filter: NotificationSearchFilter = {},
        pagination: PaginationOptions = {},
    ): Promise<{
        items: HmsNotification[];
        total: number;
    }> {
        const limit = Math.min(
            Math.max(pagination.limit ?? 50, 1),
            500,
        );
        const offset = Math.max(pagination.offset ?? 0, 0);

        const orderBy =
            pagination.orderBy ?? 'created_at';
        const orderDir =
            pagination.orderDir ?? 'DESC';

        const qb = this.createQueryBuilder('n');

        this.applyFilter(qb, filter);

        const [items, total] = await qb
            .orderBy(`n.${orderBy}`, orderDir)
            .take(limit)
            .skip(offset)
            .getManyAndCount();

        return { items, total };
    }

    /**
     * Helper to apply search filters to a query builder.
     */
    private applyFilter(
        qb: SelectQueryBuilder<HmsNotification>,
        filter: NotificationSearchFilter,
    ) {
        if (filter.channel) {
            if (Array.isArray(filter.channel)) {
                qb.andWhere('n.channel IN (:...ch)', {
                    ch: filter.channel,
                });
            } else {
                qb.andWhere('n.channel = :ch', {
                    ch: filter.channel,
                });
            }
        }

        if (filter.status) {
            if (Array.isArray(filter.status)) {
                qb.andWhere('n.status IN (:...st)', {
                    st: filter.status,
                });
            } else {
                qb.andWhere('n.status = :st', {
                    st: filter.status,
                });
            }
        }

        if (filter.notifiable_type) {
            qb.andWhere('n.notifiable_type = :nt', {
                nt: filter.notifiable_type,
            });
        }

        if (filter.notifiable_id) {
            qb.andWhere('n.notifiable_id = :nid', {
                nid: filter.notifiable_id,
            });
        }

        if (filter.created_from) {
            qb.andWhere('n.created_at >= :cf', {
                cf: filter.created_from,
            });
        }

        if (filter.created_to) {
            qb.andWhere('n.created_at <= :ct', {
                ct: filter.created_to,
            });
        }

        if (filter.scheduled_from) {
            qb.andWhere('n.scheduled_at >= :sf', {
                sf: filter.scheduled_from,
            });
        }

        if (filter.scheduled_to) {
            qb.andWhere('n.scheduled_at <= :stt', {
                stt: filter.scheduled_to,
            });
        }

        if (filter.text) {
            qb.andWhere(
                '(n.subject ILIKE :txt OR n.body ILIKE :txt)',
                { txt: `%${filter.text}%` },
            );
        }
    }
}
