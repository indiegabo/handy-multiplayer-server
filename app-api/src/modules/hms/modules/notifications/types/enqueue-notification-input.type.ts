import { NotificationChannel } from '../enums/notification-channel.enum';

/**
 * Input used to enqueue a new notification.
 */

export type EnqueueNotificationInput = {
    notifiable_type: string;
    notifiable_id: string;
    channel: NotificationChannel;

    notifier_id?: string | null;

    template_key?: string | null;
    template_version?: string | null;

    subject?: string | null;
    body?: string | null;

    data_context?: Record<string, any> | null;
    delivery_payload?: Record<string, any> | null;
    meta?: Record<string, any> | null;

    scheduled_at?: Date | null;
};
