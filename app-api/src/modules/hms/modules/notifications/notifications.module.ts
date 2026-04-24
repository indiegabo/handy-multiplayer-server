// src/core/notifications/notifications.module.ts
import { Module } from '@nestjs/common';
import { BetterLoggerModule } from '../better-logger/better-logger.module';
import { TemplateEngineModule } from '../template-engine/template-engine.module';
import { RedisModule } from '../redis/redis.module';
import { NotificationsRepository } from './repositories/notifications.repository';
import {
    NotificationsService,
    NOTIFICATION_CHANNEL_DRIVERS,
} from './services/notifications.service';
import { NotificationsQueue } from './queue/notifications.queue';
import { NotificationsWorker } from './workers/notifications.worker';
import { NotificationsGateway } from './gateways/notifications.gateway';
import { SocketIoNotificationDriver } from './drivers/socket-io-notification.driver';

@Module({
    imports: [
        BetterLoggerModule,
        TemplateEngineModule,
        RedisModule,
    ],
    providers: [
        NotificationsRepository,
        NotificationsService,
        NotificationsQueue,
        NotificationsWorker,
        NotificationsGateway, // remove if usar seu gateway global
        SocketIoNotificationDriver,
        {
            provide: NOTIFICATION_CHANNEL_DRIVERS,
            useFactory: (
                socketDriver: SocketIoNotificationDriver,
            ) => [
                    socketDriver,
                    // add email/discord drivers later
                ],
            inject: [SocketIoNotificationDriver],
        },
    ],
    exports: [
        NotificationsService,
    ],
})
export class NotificationsModule { }
