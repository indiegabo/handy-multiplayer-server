// test/mocks/redis.service.mock.ts
export class RedisServiceMock {
    public store = new Map<string, string>();
    private ttlStore = new Map<string, NodeJS.Timeout>();

    async set(key: string, value: string, ttl?: number): Promise<void> {
        this.store.set(key, value);
        if (ttl) {
            this.setTTL(key, ttl);
        }
    }

    async get(key: string): Promise<string | null> {
        return this.store.get(key) ?? null;
    }

    async del(key: string): Promise<void> {
        this.store.delete(key);
        if (this.ttlStore.has(key)) {
            clearTimeout(this.ttlStore.get(key)!);
            this.ttlStore.delete(key);
        }
    }

    async setWithExpire(key: string, value: string, ttl: number): Promise<void> {
        this.store.set(key, value);
        this.setTTL(key, ttl);
    }

    async publish(channel: string, message: string): Promise<number> {
        // Simula publicação sem listeners
        return 1;
    }

    async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
        // Apenas simulação — real não funcional sem eventos
    }

    async keys(pattern: string): Promise<string[]> {
        const regex = new RegExp(pattern.replace('*', '.*'));
        return Array.from(this.store.keys()).filter(key => regex.test(key));
    }

    async onModuleInit(): Promise<void> {
        // noop
    }

    clear(): void {
        this.store.clear();
        for (const timeout of this.ttlStore.values()) clearTimeout(timeout);
        this.ttlStore.clear();
    }

    private setTTL(key: string, ttl: number): void {
        if (this.ttlStore.has(key)) {
            clearTimeout(this.ttlStore.get(key)!);
        }
        this.ttlStore.set(
            key,
            setTimeout(() => {
                this.store.delete(key);
                this.ttlStore.delete(key);
            }, ttl * 1000)
        );
    }
}
