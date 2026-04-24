// src/one-time-tokens/one-time-tokens.service.ts
import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { RedisService } from '@hms-module/modules/redis/redis.service';
import {
    TokenGenerationOptions,
    TokenType
} from './types/token-types.enum';
import { OneTimeTokenGeneratorService } from
    './one-time-token-generartor.service';
import { BetterLogger } from
    '../better-logger/better-logger.service';
import { OneTimeToken } from
    './types/one-time-token.class';

@Injectable()
export class OneTimeTokensService {
    private readonly prefix = 'ott:';
    private readonly defaultTokenOptions: TokenGenerationOptions = {
        type: TokenType.NUMERIC,
        length: 6
    };

    constructor(
        private readonly redisService: RedisService,
        private readonly tokenGenerator: OneTimeTokenGeneratorService,
        private readonly logger: BetterLogger,
    ) {
        this.logger.setContext(OneTimeTokensService.name);
    }

    generateToken(
        options: TokenGenerationOptions = this.defaultTokenOptions
    ): string {
        return this.tokenGenerator.generateToken(options);
    }

    /**
     * Create and persist a one-time token, returning the class instance.
     */
    async create(
        data: Record<string, any> = {},
        ttl: number = 15 * 60 * 1000,
        options: TokenGenerationOptions = this.defaultTokenOptions,
    ): Promise<OneTimeToken> {
        const token = this.tokenGenerator.generateToken(options);
        const now = Date.now();
        const expiresAt = now + ttl;

        const ott = new OneTimeToken(
            token,
            data,
            expiresAt,
            now
        );

        const ttlInSeconds = Math.floor(ttl / 1000);

        // Persist as plain object (safe for serialization)
        await this.redisService.setJson(
            this.getKey(token),
            ott.toPlain(),
            ttlInSeconds
        );

        return ott;
    }

    async findAndConsumeByToken(
        token: string
    ): Promise<OneTimeToken | null> {
        const ott = await this.findByToken(token);
        if (ott) {
            await this.consume(token);
        }
        return ott;
    }

    async findByToken(
        token: string
    ): Promise<OneTimeToken | null> {
        const key = this.getKey(token);

        // Read plain object and hydrate into class
        const plain = await this.redisService.getJson<{
            token: string;
            data?: Record<string, any>;
            expiresAt: number;
            createdAt: number;
        }>(key);

        if (!plain) return null;

        if (plain.expiresAt < Date.now()) {
            await this.consume(token);
            return null;
        }

        return OneTimeToken.fromPlain(plain);
    }

    async consume(token: string): Promise<void> {
        await this.redisService.del(this.getKey(token));
    }

    private getKey(token: string): string {
        return `${this.prefix}${token}`;
    }
}
