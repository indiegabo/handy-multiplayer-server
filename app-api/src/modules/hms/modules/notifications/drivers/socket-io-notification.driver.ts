// src/core/notifications/drivers/socket-io-notification.driver.ts
import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { BetterLogger } from '../../better-logger/better-logger.service';
import {
    NotificationChannelDriver,
} from '../services/notifications.service';
import { NotificationChannel } from '../enums/notification-channel.enum';
import { HmsNotification } from '../entities/notifications.entity';
import { NotificationsGateway } from '../gateways/notifications.gateway';

/**
 * Driver that emits via Socket.IO to rooms.
 */
@Injectable()
export class SocketIoNotificationDriver
    implements NotificationChannelDriver {

    public readonly channel =
        NotificationChannel.SOCKET_IO;

    constructor(
        private readonly gateway: NotificationsGateway,
        private readonly logger: BetterLogger,
    ) {
        this.logger.setContext(
            SocketIoNotificationDriver.name,
        );
    }

    async send(
        n: HmsNotification,
    ) {
        const io: Server = this.gateway.getServer();

        const defaultRoom =
            `${n.notifiable_type}:${n.notifiable_id}`;
        const extraRooms =
            Array.isArray(n.meta?.['rooms'])
                ? (n.meta?.['rooms'] as string[])
                : [];

        const rooms = [defaultRoom, ...extraRooms]
            .filter(Boolean);

        const eventName =
            (n.meta?.['eventName'] as string) ||
            'notification';

        const payload = {
            id: n.id,
            channel: n.channel,
            status: n.status,
            subject: n.subject ?? null,
            body: n.body ?? null,
            template_key: n.template_key ?? null,
            template_version: n.template_version ?? null,
            data_context: n.data_context ?? null,
            queued_at: n.queued_at,
            created_at: n.created_at,
            meta: n.meta ?? null,
        };

        for (const room of rooms) {
            io.to(room).emit(eventName, payload);
        }

        this.logger.debug(
            `Socket.IO emitted ${n.id} rooms=${rooms.join(',')}`,
        );

        return {
            sent_at: new Date(),
            delivered: false,
            read: false,
            meta_patch: {
                socket_rooms: rooms,
                socket_event: eventName,
            },
        };
    }
}
