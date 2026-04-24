// src/core/notifications/services/notifications.service.ts
import {
    Inject,
    Injectable,
    Optional,
} from '@nestjs/common';
import { BetterLogger } from '../../better-logger/better-logger.service';
import { TemplateEngineService } from '../../template-engine/template-engine.service';
import { NotificationsRepository } from '../repositories/notifications.repository';
import { HmsNotification } from '../entities/notifications.entity';
import { NotificationChannel } from '../enums/notification-channel.enum';
import { NotificationStatus } from '../enums/notification-status.enum';
import { EnqueueNotificationInput } from '../types/enqueue-notification-input.type';
import { NotificationsQueue } from '../queue/notifications.queue';
import { NotificationJobData } from '../types/notification-job-data.type';

/**
 * DI token and driver contract kept to reuse drivers.
 */
export const NOTIFICATION_CHANNEL_DRIVERS =
    'NOTIFICATION_CHANNEL_DRIVERS';

export interface NotificationChannelDriver {
    channel: NotificationChannel;
    send(
        n: HmsNotification,
    ): Promise<{
        external_id?: string;
        provider_response?: unknown;
        delivered?: boolean;
        read?: boolean;
        sent_at?: Date;
        delivered_at?: Date;
        read_at?: Date;
        meta_patch?: Record<string, unknown>;
    }>;
}

/**
 * Input to render from templates and enqueue.
 */
export type EnqueueFromTemplateInput = {
    channel: NotificationChannel;
    notifiable_type: string;
    notifiable_id: string;
    template_key: string;
    template_version?: string;
    data_context?: Record<string, unknown>;
    subject_template?: string;
    body_template?: string;
    subject_override?: string;
    layout?: string;
    scheduled_at?: Date | null;
    meta?: Record<string, unknown>;
};

@Injectable()
export class NotificationsService {
    constructor(
        private readonly repo: NotificationsRepository,
        private readonly templates: TemplateEngineService,
        private readonly queue: NotificationsQueue,
        private readonly logger: BetterLogger,
    ) {
        this.logger.setContext(NotificationsService.name);
    }

    /**
     * Enqueue a raw notification and push to Redis queue.
     */
    async enqueue(
        input: EnqueueNotificationInput,
    ): Promise<HmsNotification> {
        const entity = await this.repo.enqueue(input);

        const delay =
            this.delayFromSchedule(entity.scheduled_at);

        await this.queue.enqueue(
            this.buildJobData(entity),
            delay ? { delay } : undefined,
        );

        this.logger.debug(
            `Enqueued id=${entity.id} channel=${entity.channel} ` +
            `status=${entity.status} delay=${delay ?? 0}`,
        );

        return entity;
    }

    /**
     * Render templates then enqueue to Redis queue.
     * DB remains the source of truth for audit.
     */
    async enqueueFromTemplate(
        input: EnqueueFromTemplateInput,
    ): Promise<HmsNotification> {
        const {
            channel,
            notifiable_type,
            notifiable_id,
            template_key,
            template_version,
            data_context,
            subject_template,
            body_template,
            subject_override,
            layout,
            scheduled_at,
            meta,
        } = input;

        const subject =
            subject_override ??
            (await this.tryRenderFirst(
                [
                    subject_template,
                    `${template_key}/subject`,
                    `${template_key}.subject`,
                ],
                data_context ?? {},
            ));

        const body = await this.renderBodyWithLayout(
            [
                body_template,
                `${template_key}/body`,
                `${template_key}`,
            ],
            data_context ?? {},
            layout,
        );

        const entity = await this.repo.enqueue({
            notifiable_type,
            notifiable_id,
            channel,
            subject: subject ?? null,
            body: body ?? null,
            template_key,
            template_version: template_version ?? null,
            data_context: (data_context as any) ?? null,
            delivery_payload: null,
            meta: (meta as any) ?? null,
            scheduled_at: scheduled_at ?? null,
        });

        const delay =
            this.delayFromSchedule(entity.scheduled_at);

        await this.queue.enqueue(
            this.buildJobData(entity),
            delay ? { delay } : undefined,
        );

        this.logger.debug(
            `Enqueued from template ${template_key} ` +
            `as id=${entity.id} delay=${delay ?? 0}`,
        );

        return entity;
    }

    /**
     * Promote due scheduled to queued in DB (optional).
     * With BullMQ delay, this is not strictly necessary,
     * but can be kept for dashboards.
     */
    async promoteDueScheduledToQueued(): Promise<void> {
        // No-op with BullMQ delay; keep if you display counts.
        return;
    }

    private buildJobData(
        n: HmsNotification,
    ): NotificationJobData {
        return {
            id: n.id,
            channel: n.channel,
            notifiable_type: n.notifiable_type,
            notifiable_id: n.notifiable_id,
            subject: n.subject ?? null,
            body: n.body ?? null,
            data_context: n.data_context ?? null,
            meta: n.meta ?? null,
            scheduled_at: n.scheduled_at
                ? n.scheduled_at.toISOString()
                : null,
        };
    }

    private delayFromSchedule(
        scheduled?: Date | null,
    ): number | undefined {
        if (!scheduled) return undefined;
        const ms = scheduled.getTime() - Date.now();
        return ms > 0 ? ms : 0;
    }

    private async tryRenderFirst(
        candidates: Array<string | undefined>,
        ctx: Record<string, unknown>,
    ): Promise<string | null> {
        for (const c of candidates) {
            if (!c) continue;
            try {
                const out =
                    this.templates.renderTemplate(
                        c,
                        ctx as any,
                    );
                if (out != null) return out;
            } catch (err: any) {
                const msg = String(err?.message ?? '');
                if (!msg.includes('Template not found')) {
                    throw err;
                }
            }
        }
        return null;
    }

    private async renderBodyWithLayout(
        candidates: Array<string | undefined>,
        ctx: Record<string, unknown>,
        layout?: string,
    ): Promise<string> {
        const errors: string[] = [];

        for (const c of candidates) {
            if (!c) continue;
            try {
                const inner =
                    this.templates.renderTemplate(
                        c,
                        ctx as any,
                    );

                if (!layout) return inner;

                return this.templates.renderTemplate(
                    layout,
                    { ...(ctx as any), body: inner },
                );
            } catch (err: any) {
                const msg = String(err?.message ?? '');
                errors.push(`${c}: ${msg}`);
                if (!msg.includes('Template not found')) {
                    throw err;
                }
            }
        }

        throw new Error(
            'No body template found. Tried: ' +
            errors.join(' | '),
        );
    }
}
