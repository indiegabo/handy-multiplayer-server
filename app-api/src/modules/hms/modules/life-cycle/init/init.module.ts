import { Module } from '@nestjs/common';
import { BetterLoggerModule } from '@hms-module/modules/better-logger/better-logger.module';
import { InitService } from './init.service';
import { RedisModule } from '../../redis/redis.module';
import { resolve } from 'path';
import { DiscoveryModule } from '@nestjs/core';

@Module({
    imports: [
        DiscoveryModule,
        BetterLoggerModule,
        RedisModule,
    ],
    exports: [InitService],
    providers: [
        {
            provide: 'LOG_DIRECTORY',
            useValue: process.env.LOG_DIRECTORY || resolve(process.cwd(), 'logs')
        },
        InitService
    ],
})
export class InitModule { }