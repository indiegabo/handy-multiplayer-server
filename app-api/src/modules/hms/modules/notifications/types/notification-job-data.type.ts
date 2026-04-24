// src/core/notifications/types/notification-job-data.type.ts
import { NotificationChannel } from '../enums/notification-channel.enum';

/**
 * Job payload sent to Redis queue.
 * Keep it compact and deterministic.
 */
export type NotificationJobData = {
    id: string;
    channel: NotificationChannel;
    notifiable_type: string;
    notifiable_id: string;
    subject?: string | null;
    body?: string | null;
    data_context?: Record<string, unknown> | null;
    meta?: Record<string, unknown> | null;
    scheduled_at?: string | null; // ISO string for delay calc
};
