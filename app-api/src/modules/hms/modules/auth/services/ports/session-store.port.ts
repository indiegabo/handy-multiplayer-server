export abstract class SessionStorePort {
    /**
     * Set a JSON-serializable value with TTL (seconds).
     */
    abstract setJson(
        key: string,
        value: unknown,
        ttlSeconds: number
    ): Promise<void>;

    /**
     * Get a JSON-serializable value by key.
     */
    abstract getJson<T>(
        key: string
    ): Promise<T | null>;

    /**
     * Delete a key.
     */
    abstract del(
        key: string
    ): Promise<void>;
}
