import { Injectable } from "@nestjs/common";
import { SessionStorePort } from "../ports/session-store.port";
import { RedisService } from "@hms-module/modules/redis/redis.service";

@Injectable()
export class RedisSessionStoreAdapter extends SessionStorePort {
    constructor(
        private readonly redis: RedisService,
    ) {
        super();
    }

    async setJson(
        key: string,
        value: unknown,
        ttlSeconds: number
    ): Promise<void> {
        await this.redis.setJson(key, value, ttlSeconds);
    }

    async getJson<T>(
        key: string
    ): Promise<T | null> {
        return this.redis.getJson<T>(key);
    }

    async del(
        key: string
    ): Promise<void> {
        await this.redis.del(key);
    }
}
