import { jest } from "@jest/globals";
import { v4 as uuid } from "uuid";
import { SCOPED_TOKENS_MOCK } from
    "../entities/scoped-token.mock";
import { ScopedToken } from
    "@hms-module/modules/scoped-tokens/entities/scoped-token.entity";

/**
 * Utility: compare two UUID string ids.
 */
function sameId(a?: string | null, b?: string | null): boolean {
    return Boolean(a && b && a === b);
}

/**
 * Utility: normalize an unknown into a valid Date or null.
 */
function ensureDate(d: unknown): Date | null {
    if (d instanceof Date) return d;
    if (typeof d === "string" || typeof d === "number") {
        const dt = new Date(d as any);
        return Number.isFinite(dt.getTime()) ? dt : null;
    }
    return null;
}

/**
 * Hydrate a plain object into a real ScopedToken instance so that the
 * class method isRevoked() is available.
 */
function hydrateScopedToken(
    data: Partial<ScopedToken>,
): ScopedToken {
    const e = new ScopedToken();

    e.id = data.id ?? uuid();
    e.token = data.token ?? `mock-token-${Date.now()}`;
    e.creator_id =
        (data.creator_id as string | null | undefined) ?? null;
    e.creator = data.creator ?? null;
    e.scopes = data.scopes ?? [];
    // In entity, data is nullable with default {}; accept null here.
    e.data = (data.data as Record<string, any> | null | undefined)
        ?? null;

    e.revoker_id =
        (data.revoker_id as string | null | undefined) ?? null;
    e.revoker = data.revoker ?? null;
    e.revoked_at =
        ensureDate(data.revoked_at) ?? null;

    const now = new Date();
    e.created_at = ensureDate(data.created_at) ?? now;
    e.updated_at = ensureDate(data.updated_at) ?? now;

    return e;
}

/**
 * Concrete mock type. We keep jest.Mock to avoid signature drift while
 * still providing clear param types via implementations.
 */
export type MockScopedTokenRepository = {
    findById: jest.Mock;
    findByToken: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    revoke: jest.Mock;
    delete: jest.Mock;
    findActiveByCreator: jest.Mock;
    getInternalTokenCount: jest.Mock;
};

/**
 * Factory to create a mock ScopedTokenRepository with in-memory state.
 * All items are stored as class instances (hydrated) to preserve methods.
 */
export const createMockScopedTokenRepository = (
    initialTokens: ScopedToken[] = SCOPED_TOKENS_MOCK,
): MockScopedTokenRepository => {
    let currentTokens: ScopedToken[] = initialTokens.map((x) =>
        x instanceof ScopedToken ? x : hydrateScopedToken(x),
    );

    const usedIds = new Set(currentTokens.map((t) => t.id));

    const generateNewId = (): string => {
        let id: string;
        do {
            id = uuid();
        } while (usedIds.has(id));
        usedIds.add(id);
        return id;
    };

    const repo: MockScopedTokenRepository = {
        findById: jest.fn(async (id: string): Promise<ScopedToken | null> => {
            return currentTokens.find((t) => sameId(t.id, id)) ?? null;
        }),

        findByToken: jest.fn(async (
            token: string,
        ): Promise<ScopedToken | null> => {
            return currentTokens.find((t) => t.token === token) ?? null;
        }),

        create: jest.fn(async (
            tokenData: Partial<ScopedToken>,
        ): Promise<ScopedToken> => {
            const token = hydrateScopedToken({
                ...tokenData,
                id: tokenData.id ?? generateNewId(),
                token: tokenData.token ?? `mock-token-${Date.now()}`,
                created_at: tokenData.created_at ?? new Date(),
                updated_at: tokenData.updated_at ?? new Date(),
            });
            currentTokens.push(token);
            return token;
        }),

        save: jest.fn(async (
            input: ScopedToken | Partial<ScopedToken>,
        ): Promise<ScopedToken> => {
            const entity = input instanceof ScopedToken
                ? input
                : hydrateScopedToken(input);

            if (!entity.id) {
                entity.id = generateNewId();
            }
            entity.updated_at = new Date();

            const idx = currentTokens.findIndex((t) =>
                sameId(t.id, entity.id),
            );
            if (idx !== -1) {
                currentTokens[idx] = entity;
            } else {
                currentTokens.push(entity);
            }
            return entity;
        }),

        revoke: jest.fn(async (
            tokenId: string,
            revokerId: string,
        ): Promise<ScopedToken> => {
            const token = currentTokens.find((t) =>
                sameId(t.id, tokenId),
            );
            if (!token) {
                throw new Error("Token not found");
            }
            token.revoked_at = new Date();
            token.revoker_id = revokerId; // UUID string
            token.updated_at = new Date();
            return token;
        }),

        delete: jest.fn(async (tokenId: string): Promise<void> => {
            currentTokens = currentTokens.filter((t) =>
                !sameId(t.id, tokenId),
            );
            return;
        }),

        findActiveByCreator: jest.fn(async (
            creatorId: string | null,
        ): Promise<ScopedToken[]> => {
            return currentTokens.filter((t) =>
                sameId(t.creator_id ?? null, creatorId ?? null) &&
                t.revoked_at === null,
            );
        }),

        getInternalTokenCount: jest.fn(() => currentTokens.length),
    };

    return repo;
};
