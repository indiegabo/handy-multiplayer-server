import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import Redis from 'ioredis';

@Module({
    providers: [RedisService],
    exports: [RedisService],
})
export class RedisModule { }