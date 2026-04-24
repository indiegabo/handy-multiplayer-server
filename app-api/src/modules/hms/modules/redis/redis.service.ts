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

    // #region Properties and Constructor

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
            keepAlive: 10_000,
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

    // #endregion

    // #region Utility Functions

    /**
     * Validates a Redis key to prevent code injection.
     * Only allows alphanumeric, dash and underscore characters.
     * @param {string} key Redis key to validate.
     * @returns {boolean} True if valid, false otherwise.
     */
    private isValidRedisKey(key: string): boolean {
        return /^[a-zA-Z0-9\-_]+$/.test(key);
    }

    /**
     * Validates a Redis lock token to prevent code injection.
     * Only allows alphanumeric, dash and underscore.
     * @param {string} token Redis lock token to validate.
     * @returns {boolean} True if valid, false otherwise.
     */
    private isValidRedisToken(token: string): boolean {
        return /^[a-zA-Z0-9\-_]+$/.test(token);
    }

    // #endregion

    // #region Lifecycle Management

    /**
     * Verify connectivity and start heartbeat
     * on module init.
     * @returns {Promise<void>}
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
     * @returns {Promise<void>}
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
        // Intentionally silent: 'connect' | 'ready' | 'close' | 'end' | 'reconnecting'
    }

    /**
     * Start a periodic ping to keep the connection
     * alive. Silent on transient failures.
     */
    private startHeartbeat(): void {
        if (this.heartbeat) return;

        const period =
            9_000 + Math.floor(Math.random() * 2_000);

        this.heartbeat = setInterval(() => {
            this.client.ping()
                .catch(() => { /* silent */ });
        }, period);

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

    // #endregion

    // #region Connection and Client Management

    /**
     * Get the shared ioredis client for short-lived
     * commands.
     * @returns {Redis} Shared Redis client instance.
     */
    public getClient(): Redis {
        return this.client;
    }

    /**
     * Get connection options for BullMQ.
     * BullMQ should open its own blocking/pub-sub
     * connections.
     * @returns {RedisOptions} Connection options for BullMQ.
     */
    public getBullConnectionOptions(): RedisOptions {
        return { ...this.options };
    }

    /**
     * Create a dedicated ephemeral client.
     * Remember to call .quit() when done.
     * Only logs errors.
     * @returns {Redis} Dedicated Redis client instance.
     */
    public createDedicatedClient(): Redis {
        const cli = new Redis(this.options);

        cli.on('error', (err: any) => {
            this.logger.error(
                `Redis(dedicated) error: ${err?.message} ` +
                `(code=${err?.code} errno=${err?.errno})`,
            );
        });

        return cli;
    }

    // #endregion

    // #region Health and Diagnostics

    /**
     * Ping the Redis server.
     * @returns {Promise<string>} Redis PONG response.
     */
    public async ping(): Promise<string> {
        return this.client.ping();
    }

    // #endregion

    // #region Key-Value Operations

    /**
     * Set a key with an optional TTL in seconds.
     * @param {string} key Key name.
     * @param {string} value Value to store.
     * @param {number} [ttlSeconds] Optional TTL in seconds.
     * @returns {Promise<void>}
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
     * @param {string} key Key name.
     * @returns {Promise<string | null>} Value or null if not found.
     */
    public async get(
        key: string,
    ): Promise<string | null> {
        return this.client.get(key);
    }

    /**
     * Delete a key if present.
     * @param {string} key Key name.
     * @returns {Promise<void>}
     */
    public async del(key: string): Promise<void> {
        await this.client.del(key);
    }

    /**
     * Check if a key exists.
     * @param {string} key Key name.
     * @returns {Promise<boolean>} True if exists, false otherwise.
     */
    public async exists(
        key: string,
    ): Promise<boolean> {
        const res = await this.client.exists(key);
        return res === 1;
    }

    /**
     * Find keys by pattern (use with care on large datasets).
     * @param {string} pattern Pattern to match.
     * @returns {Promise<string[]>} Array of matching keys.
     */
    public async keys(
        pattern: string,
    ): Promise<string[]> {
        return this.client.keys(pattern);
    }

    /**
     * Atomic increment.
     * @param {string} key Key name.
     * @returns {Promise<number>} New value after increment.
     */
    public async incr(
        key: string,
    ): Promise<number> {
        return this.client.incr(key);
    }

    /**
     * Atomic decrement.
     * @param {string} key Key name.
     * @returns {Promise<number>} New value after decrement.
     */
    public async decr(
        key: string,
    ): Promise<number> {
        return this.client.decr(key);
    }

    // #endregion

    // #region TTL (Time-To-Live) Operations

    /**
     * Set TTL in seconds.
     * Returns true if TTL set.
     * @param {string} key Key name.
     * @param {number} ttlSeconds TTL in seconds.
     * @returns {Promise<boolean>} True if TTL set.
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
     * @param {string} key Key name.
     * @param {number} ttlMs TTL in milliseconds.
     * @returns {Promise<boolean>} True if TTL set.
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
     * @param {string} key Key name.
     * @returns {Promise<number>} TTL in seconds.
     */
    public async ttl(
        key: string,
    ): Promise<number> {
        return this.client.ttl(key);
    }

    /**
     * Get TTL (milliseconds).
     * -1 persistent; -2 missing.
     * @param {string} key Key name.
     * @returns {Promise<number>} TTL in milliseconds.
     */
    public async pttl(
        key: string,
    ): Promise<number> {
        return this.client.pttl(key);
    }

    /**
     * Remove TTL and make key persistent.
     * Returns true if persisted.
     * @param {string} key Key name.
     * @returns {Promise<boolean>} True if persisted.
     */
    public async persist(
        key: string,
    ): Promise<boolean> {
        const r = await this.client.persist(key);
        return r === 1;
    }

    // #endregion

    // #region JSON Helpers

    /**
     * Store a JSON-serialized object.
     * Silent if a pre-stringified value is passed.
     * @param {string} key Key name.
     * @param {T} value Object to serialize.
     * @param {number} [ttlSeconds] Optional TTL in seconds.
     * @returns {Promise<void>}
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
     * If stored as a pre-stringified JSON, parse twice once.
     * @param {string} key Key name.
     * @returns {Promise<T | null>} Parsed object or null.
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
     * @param {string} key Key name.
     * @param {(current: T) => T} updater Function to update object.
     * @returns {Promise<boolean>} True if updated.
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

    // #endregion

    // #region Pub/Sub Operations

    /**
     * Publish a message on a channel.
     * Returns number of receivers.
     * @param {string} channel Channel name.
     * @param {string} message Message to publish.
     * @returns {Promise<number>} Number of receivers.
     */
    public async publish(
        channel: string,
        message: string,
    ): Promise<number> {
        return this.client.publish(channel, message);
    }

    /**
     * Subscribe to a channel. Returns cleanup to unsubscribe.
     * @param {string} channel Channel name.
     * @param {(msg: string) => void} onMessage Callback for messages.
     * @returns {Promise<() => Promise<void>>} Cleanup function.
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

    // #endregion

    // #region Simple Distributed Locks

    /**
     * Acquire a lock using SET NX PX.
     * Returns lock token if acquired, else null.
     * @param {string} key Lock key.
     * @param {number} ttlMs Lock TTL in milliseconds.
     * @param {string} [token] Optional lock token.
     * @returns {Promise<string | null>} Lock token or null.
     */
    public async acquireLock(
        key: string,
        ttlMs: number,
        token?: string,
    ): Promise<string | null> {
        if (!this.isValidRedisKey(key)) {
            throw new Error('Invalid Redis key format');
        }
        if (token && !this.isValidRedisToken(token)) {
            throw new Error('Invalid Redis lock token format');
        }
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
     * @param {string} key Lock key.
     * @param {string} token Lock token.
     * @returns {Promise<boolean>} True if lock released.
     */
    public async releaseLock(
        key: string,
        token: string,
    ): Promise<boolean> {
        if (!this.isValidRedisKey(key)) {
            throw new Error('Invalid Redis key format');
        }
        if (!this.isValidRedisToken(token)) {
            throw new Error('Invalid Redis lock token format');
        }
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
     * @param {string} key Lock key.
     * @param {string} token Lock token.
     * @param {number} ttlMs New TTL in milliseconds.
     * @returns {Promise<boolean>} True if lock extended.
     */
    public async extendLock(
        key: string,
        token: string,
        ttlMs: number,
    ): Promise<boolean> {
        if (!this.isValidRedisKey(key)) {
            throw new Error('Invalid Redis key format');
        }
        if (!this.isValidRedisToken(token)) {
            throw new Error('Invalid Redis lock token format');
        }
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

    // #endregion
}
