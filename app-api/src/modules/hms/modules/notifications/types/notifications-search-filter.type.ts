import { NotificationChannel } from '../enums/notification-channel.enum';
import { NotificationStatus } from '../enums/notification-status.enum';

/**
 * Optional filter used by the search method.
 */

export type NotificationSearchFilter = {
    channel?: NotificationChannel | NotificationChannel[];
    status?: NotificationStatus | NotificationStatus[];

    notifiable_type?: string;
    notifiable_id?: string;

    created_from?: Date;
    created_to?: Date;

    scheduled_from?: Date;
    scheduled_to?: Date;

    text?: string; // searches subject/body (ILIKE)
};
