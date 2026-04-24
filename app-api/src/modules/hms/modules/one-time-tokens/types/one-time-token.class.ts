export class OneTimeToken<T = Record<string, any>> {
    // Keeping fields public for easy (de)serialization
    token: string;
    data?: T;
    expiresAt: number;
    createdAt: number;

    constructor(
        token: string,
        data: T | undefined,
        expiresAt: number,
        createdAt: number
    ) {
        this.token = token;
        this.data = data;
        this.expiresAt = expiresAt;
        this.createdAt = createdAt;
    }

    /** Cast helper for strongly typed metadata. */
    getDataAs<U>(): U | undefined {
        return this.data as unknown as U | undefined;
    }

    /** Serialize to a plain object (safe for Redis/DB). */
    toPlain(): {
        token: string;
        data?: T;
        expiresAt: number;
        createdAt: number;
    } {
        return {
            token: this.token,
            data: this.data,
            expiresAt: this.expiresAt,
            createdAt: this.createdAt,
        };
    }

    /** Hydrate from a plain object. */
    static fromPlain<T>(
        plain: {
            token: string;
            data?: T;
            expiresAt: number;
            createdAt: number;
        }
    ): OneTimeToken<T> {
        return new OneTimeToken<T>(
            plain.token,
            plain.data,
            plain.expiresAt,
            plain.createdAt
        );
    }
}
