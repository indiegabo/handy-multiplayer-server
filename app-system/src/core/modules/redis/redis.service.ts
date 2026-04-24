// English-only code and comments by project convention.

import {
    Injectable,
    Logger,
    OnModuleDestroy,
    OnModuleInit,
} from '@nestjs/common';
import Redis, { RedisOptions } from 'ioredis';
import { randomUUID } from 'crypto';

type Timer = ReturnType<typeof setInterval> | null;

/**
 * Central Redis service.
 *
 * Responsibilities:
 * - Maintain a shared ioredis client for short ops.
 * - Expose connection options for BullMQ to open its own
 *   dedicated connections (recommended).
 * - Provide helpers for KV, TTL, JSON, Pub/Sub, and simple locks.
 *
 * Notes:
 * - Keep methods short, deterministic, and side-effect free.
 * - Prefer explicit return types.
 * - Log only errors.
 */
@Injectable()
export class RedisService
    implements OnModuleInit, OnModuleDestroy {

    private readonly logger =
        new Logger(RedisService.name);

    /**
     * Shared client for basic commands (non-blocking).
     * Do not use for long blocking ops or Pub/Sub loops.
     */
    private client: Redis;

    /**
     * Canonical connection options.
     * Exposed so BullMQ can build dedicated connections.
     */
    private readonly options: RedisOptions;

    /**
     * Heartbeat interval to keep the TCP connection warm.
     */
    private heartbeat: Timer = null;

    constructor() {
        const host =
            process.env.REDIS_HOST || 'localhost';
        const port =
            parseInt(process.env.REDIS_PORT || '6379', 10);
        const password =
            process.env.REDIS_PASSWORD || undefined;
        const db =
            process.env.REDIS_DB !== undefined
                ? parseInt(process.env.REDIS_DB, 10)
                : undefined;

        this.options = {
            host,
            port,
            password,
            db,
            keepAlive: 10_000, // 10s
            connectTimeout: 10_000,
            family: 4 as any,
            retryStrategy: (times) => {
                const base =
                    Math.min(times * 100, 5_000);
                const jitter =
                    Math.floor(Math.random() * 150);
                return base + jitter;
            },
            enableReadyCheck: true,
            enableAutoPipelining: true,
            connectionName:
                process.env.APP_NAME || 'app-api',
            maxRetriesPerRequest: null,
            reconnectOnError: (err) => {
                const msg = err?.message || '';
                if (msg.includes('READONLY')) return true;
                if (msg.includes('ECONNRESET')) return true;
                if (msg.includes('EPIPE')) return true;
                return false;
            },
        };

        this.client = new Redis(this.options);
        this.setupEventListeners();
    }

    /* ------------------------------------ */
    /*  Lifecycle                           */
    /* ------------------------------------ */

    /**
     * Verify connectivity and start heartbeat
     * on module init.
     */
    async onModuleInit(): Promise<void> {
        try {
            await this.client.ping();
            this.startHeartbeat();
        } catch (err) {
            this.logger.error(
                'Failed to connect to Redis',
                err as Error,
            );
        }
    }

    /**
     * Gracefully close on module destroy.
     * Attempts QUIT, falls back to disconnect.
     * Stops heartbeat.
     */
    async onModuleDestroy(): Promise<void> {
        this.stopHeartbeat();
        try {
            await this.client.quit();
        } catch (err) {
            this.logger.error(
                'Error closing Redis',
                err as Error,
            );
            try {
                this.client.disconnect();
            } catch {
                /* no-op */
            }
        }
    }

    /**
     * Attach event listeners to the shared client.
     * Only log errors.
     */
    private setupEventListeners(): void {
        this.client.on('error', (err: any) => {
            this.logger.error(
                `Redis error: ${err?.message} ` +
                `(code=${err?.code} errno=${err?.errno})`,
            );
        });

        // Intentionally silent:
        // 'connect' | 'ready' | 'close' | 'end' | 'reconnecting'
    }

    /**
     * Start a periodic ping to keep the connection
     * alive. Silent on transient failures.
     */
    private startHeartbeat(): void {
        if (this.heartbeat) return;

        const period =
            9_000 + Math.floor(Math.random() * 2_000); // 9–11s

        this.heartbeat = setInterval(() => {
            this.client.ping()
                .catch(() => { /* silent */ });
        }, period);

        // Do not keep the process alive just for this timer.
        (this.heartbeat as any)?.unref?.();
    }

    /**
     * Stop the periodic ping.
     */
    private stopHeartbeat(): void {
        if (!this.heartbeat) return;
        clearInterval(this.heartbeat);
        this.heartbeat = null;
    }

    /* ------------------------------------ */
    /*  Exposed Connections / Options       */
    /* ------------------------------------ */

    /**
     * Get the shared ioredis client for short-lived
     * commands.
     */
    public getClient(): Redis {
        return this.client;
    }

    /**
     * Get connection options for BullMQ.
     * BullMQ should open its own blocking/pub-sub
     * connections.
     */
    public getBullConnectionOptions(): RedisOptions {
        return { ...this.options };
    }

    /**
     * Create a dedicated ephemeral client.
     * Remember to call .quit() when done.
     * Only logs errors.
     */
    public createDedicatedClient(): Redis {
        const cli = new Redis(this.options);

        cli.on('error', (err: any) => {
            this.logger.error(
                `Redis(dedicated) error: ${err?.message} ` +
                `(code=${err?.code} errno=${err?.errno})`,
            );
        });

        // Intentionally silent on reconnecting/close/etc.
        return cli;
    }

    /* ------------------------------------ */
    /*  Health / Diagnostics                 */
    /* ------------------------------------ */

    /**
     * Ping the Redis server.
     */
    public async ping(): Promise<string> {
        return this.client.ping();
    }

    /* ------------------------------------ */
    /*  KV Operations                        */
    /* ------------------------------------ */

    /**
     * Set a key with an optional TTL in seconds.
     */
    public async set(
        key: string,
        value: string,
        ttlSeconds?: number,
    ): Promise<void> {
        if (ttlSeconds && ttlSeconds > 0) {
            await this.client.setex(
                key,
                ttlSeconds,
                value,
            );
            return;
        }
        await this.client.set(key, value);
    }

    /**
     * Get a string value.
     */
    public async get(
        key: string,
    ): Promise<string | null> {
        return this.client.get(key);
    }

    /**
     * Delete a key if present.
     */
    public async del(key: string): Promise<void> {
        await this.client.del(key);
    }

    /**
     * Check if a key exists.
     */
    public async exists(
        key: string,
    ): Promise<boolean> {
        const res = await this.client.exists(key);
        return res === 1;
    }

    /**
     * Find keys by pattern (use with care on
     * large datasets).
     */
    public async keys(
        pattern: string,
    ): Promise<string[]> {
        return this.client.keys(pattern);
    }

    /**
     * Atomic increment.
     */
    public async incr(
        key: string,
    ): Promise<number> {
        return this.client.incr(key);
    }

    /**
     * Atomic decrement.
     */
    public async decr(
        key: string,
    ): Promise<number> {
        return this.client.decr(key);
    }

    /* ------------------------------------ */
    /*  TTL Operations                       */
    /* ------------------------------------ */

    /**
     * Set TTL in seconds.
     * Returns true if TTL set.
     */
    public async expire(
        key: string,
        ttlSeconds: number,
    ): Promise<boolean> {
        const r = await this.client.expire(
            key,
            ttlSeconds,
        );
        return r === 1;
    }

    /**
     * Set TTL in milliseconds.
     * Returns true if TTL set.
     */
    public async pexpire(
        key: string,
        ttlMs: number,
    ): Promise<boolean> {
        const r = await this.client.pexpire(
            key,
            ttlMs,
        );
        return r === 1;
    }

    /**
     * Get TTL (seconds).
     * -1 persistent; -2 missing.
     */
    public async ttl(
        key: string,
    ): Promise<number> {
        return this.client.ttl(key);
    }

    /**
     * Get TTL (milliseconds).
     * -1 persistent; -2 missing.
     */
    public async pttl(
        key: string,
    ): Promise<number> {
        return this.client.pttl(key);
    }

    /**
     * Remove TTL and make key persistent.
     * Returns true if persisted.
     */
    public async persist(
        key: string,
    ): Promise<boolean> {
        const r = await this.client.persist(key);
        return r === 1;
    }

    /* ------------------------------------ */
    /*  JSON Helpers                         */
    /* ------------------------------------ */

    /**
     * Store a JSON-serialized object.
     * Silent if a pre-stringified value is passed.
     */
    public async setJson<T>(
        key: string,
        value: T,
        ttlSeconds?: number,
    ): Promise<void> {
        const s = JSON.stringify(value);
        await this.set(key, s, ttlSeconds);
    }

    /**
     * Retrieve and parse JSON.
     * If stored as a pre-stringified JSON,
     * parse twice once.
     */
    public async getJson<T>(
        key: string,
    ): Promise<T | null> {
        const s = await this.client.get(key);
        if (!s) return null;

        let first: unknown;
        try {
            first = JSON.parse(s);
        } catch {
            return null;
        }

        if (typeof first === 'string') {
            try {
                return JSON.parse(first) as T;
            } catch {
                // Fallthrough: return as-is.
            }
        }
        return first as T;
    }

    /**
     * Update JSON while preserving TTL if present.
     */
    public async updateJson<T>(
        key: string,
        updater: (current: T) => T,
    ): Promise<boolean> {
        const exists = await this.exists(key);
        if (!exists) return false;

        const ttl = await this.ttl(key);
        const cur = await this.getJson<T>(key);
        const next = updater(cur as T);

        if (ttl === -1) {
            await this.setJson<T>(key, next);
        } else if (ttl > -2) {
            await this.setJson<T>(key, next, ttl);
        }

        return true;
    }

    /* ------------------------------------ */
    /*  Pub/Sub                              */
    /* ------------------------------------ */

    /**
     * Publish a message on a channel.
     * Returns number of receivers.
     */
    public async publish(
        channel: string,
        message: string,
    ): Promise<number> {
        return this.client.publish(channel, message);
    }

    /**
     * Subscribe to a channel. Returns cleanup
     * to unsubscribe.
     */
    public async subscribe(
        channel: string,
        onMessage: (msg: string) => void,
    ): Promise<() => Promise<void>> {
        const sub = this.createDedicatedClient();
        await sub.subscribe(channel);

        const handler = (
            ch: string,
            msg: string,
        ) => {
            if (ch === channel) onMessage(msg);
        };

        sub.on('message', handler);

        return async () => {
            try {
                sub.removeListener('message', handler);
                await sub.unsubscribe(channel);
            } finally {
                try {
                    await sub.quit();
                } catch {
                    sub.disconnect();
                }
            }
        };
    }

    /* ------------------------------------ */
    /*  Simple Distributed Locks             */
    /* ------------------------------------ */

    /**
     * Acquire a lock using SET NX PX.
     * Returns lock token if acquired, else null.
     */
    public async acquireLock(
        key: string,
        ttlMs: number,
        token?: string,
    ): Promise<string | null> {
        const value = token ?? randomUUID();
        const res = await this.client.set(
            key,
            value,
            'PX',
            ttlMs,
            'NX',
        );
        return res === 'OK' ? value : null;
    }

    /**
     * Release a lock only if token matches.
     * Returns true if lock released.
     */
    public async releaseLock(
        key: string,
        token: string,
    ): Promise<boolean> {
        const script = `
            if redis.call("GET", KEYS[1]) == ARGV[1]
            then
                return redis.call("DEL", KEYS[1])
            else
                return 0
            end
        `;
        const r = await this.client.eval(
            script,
            1,
            key,
            token,
        ) as number;
        return r === 1;
    }

    /**
     * Extend a lock only if token matches.
     * Returns true if lock extended.
     */
    public async extendLock(
        key: string,
        token: string,
        ttlMs: number,
    ): Promise<boolean> {
        const script = `
            if redis.call("GET", KEYS[1]) == ARGV[1]
            then
                return redis.call("PEXPIRE", KEYS[1], ARGV[2])
            else
                return 0
            end
        `;
        const r = await this.client.eval(
            script,
            1,
            key,
            token,
            String(ttlMs),
        ) as number;
        return r === 1;
    }
}
