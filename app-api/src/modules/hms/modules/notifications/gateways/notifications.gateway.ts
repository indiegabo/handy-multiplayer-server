// src/core/notifications/gateways/notifications.gateway.ts
import {
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

/**
 * Dedicated namespace for notifications.
 */
@WebSocketGateway({
    namespace: '/notifications',
    cors: { origin: true, credentials: true },
})
export class NotificationsGateway {
    @WebSocketServer()
    public server!: Server;

    getServer(): Server {
        return this.server;
    }
}
