import { jest } from "@jest/globals";
import {
    FindOneOptions,
    FindOptionsWhere,
} from "typeorm";
import { v4 as uuid } from "uuid";
import { REFRESH_TOKENS_MOCK } from
    "../entities/refresh-tokens.mock";
import { RefreshTokenRepository } from
    "@hms-module/modules/auth/repositories/refresh-token.repository";
import { RefreshToken } from
    "@hms-module/modules/auth/entities/refresh-token.entity";
import { UserType } from "@shared-types";

/**
 * Utility: compare two UUID string ids.
 */
function sameId(a?: string, b?: string): boolean {
    return Boolean(a && b && a === b);
}

/**
 * Utility: unwrap a TypeORM FindOperator-like value.
 * Supports: LessThan(date) or direct Date.
 */
function unwrapFindValue<T = unknown>(val: unknown): T | null {
    if (val instanceof Date) return val as T;
    if (val && typeof val === "object") {
        const anyVal = val as any;
        if ("value" in anyVal) return anyVal.value as T;
        if ("_value" in anyVal) return anyVal._value as T;
    }
    return null;
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
 * Hydrate a plain object into a real RefreshToken instance so that
 * class methods (isExpired, belongsToAdmin) are available.
 */
function hydrateRefreshToken(
    data: Partial<RefreshToken>,
): RefreshToken {
    const e = new RefreshToken();

    // Required with defaults
    e.id = data.id ?? uuid();
    e.token = data.token ?? "";
    e.user_id = data.user_id ?? uuid();
    e.user_type = (data.user_type ?? "end_user") as UserType;
    e.is_revoked = data.is_revoked ?? false;
    e.last_used_at = ensureDate(data.last_used_at) ?? new Date();
    e.expires_at = ensureDate(data.expires_at) ??
        new Date(Date.now() + 3_600_000);
    e.refresh_count = data.refresh_count ?? 0;
    e.created_at = ensureDate(data.created_at) ?? new Date();
    e.updated_at = ensureDate(data.updated_at) ?? new Date();

    // Optionals
    e.device_info = data.device_info ?? null;
    e.ip_address = data.ip_address ?? null;
    e.user = data.user ?? null;
    e.admin = data.admin ?? null;

    return e;
}

/**
 * Minimal contract for an entity manager used inside transaction.
 */
type MockEntityManager = {
    delete: (entity: any, criteria: any) => Promise<void>;
};

/**
 * Transaction callback signature used by the mock.
 */
type TransactionCallback = (
    manager: MockEntityManager,
) => any | Promise<any>;

/**
 * Full mocked repository type.
 */
export type MockRefreshTokenRepository =
    Partial<Record<keyof RefreshTokenRepository, jest.Mock>> & {
        getInternalTokenCount: jest.Mock;
    };

/**
 * Factory to create a mock RefreshTokenRepository with in-memory state.
 */
export const createMockRefreshTokenRepository = (
    initialRefreshTokens: RefreshToken[] = REFRESH_TOKENS_MOCK,
): MockRefreshTokenRepository => {
    // Always hold hydrated instances internally
    let currentRefreshTokens: RefreshToken[] =
        initialRefreshTokens.map((x) =>
            x instanceof RefreshToken ? x : hydrateRefreshToken(x),
        );

    const repo: MockRefreshTokenRepository = {
        // ────────────────────────────────────────────────────────────────────────
        // Domain methods
        // ────────────────────────────────────────────────────────────────────────

        findByToken: jest.fn().mockImplementation(async (token: string) => {
            return currentRefreshTokens.find((rt) => rt.token === token) ?? null;
        }),

        deleteExpiredTokens: jest.fn().mockImplementation(async () => {
            const now = new Date();
            currentRefreshTokens = currentRefreshTokens.filter(
                (rt) => rt.expires_at > now,
            );
            return;
        }),

        // ────────────────────────────────────────────────────────────────────────
        // TypeORM-like methods used by the app
        // ────────────────────────────────────────────────────────────────────────

        findOne: jest.fn().mockImplementation(async (
            options: FindOneOptions<RefreshToken>,
        ) => {
            if (options?.where) {
                const where = options.where as Partial<RefreshToken> & {
                    id?: string; token?: string; user_id?: string;
                };

                if (where.id) {
                    return currentRefreshTokens.find((rt) =>
                        sameId(rt.id, where.id),
                    ) ?? null;
                }
                if (where.token) {
                    return currentRefreshTokens.find((rt) =>
                        rt.token === where.token,
                    ) ?? null;
                }
                if (where.user_id) {
                    return currentRefreshTokens.find((rt) =>
                        sameId(rt.user_id, where.user_id),
                    ) ?? null;
                }
            }
            return currentRefreshTokens[0] ?? null;
        }),

        /**
         * Save accepts either a real entity or a partial and always stores
         * a hydrated instance.
         */
        save: jest.fn().mockImplementation(async (
            input: RefreshToken | Partial<RefreshToken>,
        ) => {
            const entity = input instanceof RefreshToken
                ? input
                : hydrateRefreshToken(input);

            const idx = currentRefreshTokens.findIndex((rt) =>
                sameId(rt.id, entity.id),
            );
            if (idx !== -1) {
                currentRefreshTokens[idx] = entity;
            } else {
                currentRefreshTokens.push(entity);
            }
            return entity;
        }),

        delete: jest.fn().mockImplementation(async (
            criteria: FindOptionsWhere<RefreshToken>,
        ) => {
            if (!criteria) return;

            const c = criteria as Partial<RefreshToken> & {
                id?: string; token?: string; user_id?: string; expires_at?: any;
            };

            if (c.id) {
                currentRefreshTokens = currentRefreshTokens.filter(
                    (rt) => !sameId(rt.id, c.id),
                );
                return;
            }
            if (c.token) {
                currentRefreshTokens = currentRefreshTokens.filter(
                    (rt) => rt.token !== c.token,
                );
                return;
            }
            if (c.user_id) {
                currentRefreshTokens = currentRefreshTokens.filter(
                    (rt) => !sameId(rt.user_id, c.user_id),
                );
                return;
            }
            if (c.expires_at) {
                const limit = unwrapFindValue<Date>(c.expires_at) ??
                    (c.expires_at instanceof Date ? c.expires_at : null);
                if (limit) {
                    // delete where expires_at < limit
                    currentRefreshTokens = currentRefreshTokens.filter(
                        (rt) => !(rt.expires_at < limit),
                    );
                }
                return;
            }
            return;
        }),

        remove: jest.fn().mockImplementation(async (
            input: RefreshToken | Partial<RefreshToken>,
        ) => {
            const entity = input instanceof RefreshToken
                ? input
                : hydrateRefreshToken(input);

            currentRefreshTokens = currentRefreshTokens.filter(
                (rt) => !sameId(rt.id, entity.id),
            );
            return;
        }),

        getInternalTokenCount: jest.fn().mockImplementation(() =>
            currentRefreshTokens.length
        ),

        // ────────────────────────────────────────────────────────────────────────
        // Minimal transaction mock with a typed, callable callback
        // ────────────────────────────────────────────────────────────────────────

        manager: {
            transaction: jest.fn().mockImplementation(async (
                callback: TransactionCallback,
            ) => {
                // Strongly-typed delete mock that returns Promise<void>
                const deleteImpl: MockEntityManager["delete"] = jest.fn(async (
                    _entity: any,
                    criteria: any,
                ) => {
                    const c = (criteria ?? {}) as Partial<RefreshToken> & {
                        id?: string; token?: string; user_id?: string;
                    };

                    if (c.id) {
                        currentRefreshTokens = currentRefreshTokens.filter(
                            (rt) => !sameId(rt.id, c.id),
                        );
                        return;
                    }
                    if (c.token) {
                        currentRefreshTokens = currentRefreshTokens.filter(
                            (rt) => rt.token !== c.token,
                        );
                        return;
                    }
                    if (c.user_id) {
                        currentRefreshTokens = currentRefreshTokens.filter(
                            (rt) => !sameId(rt.user_id, c.user_id),
                        );
                        return;
                    }
                    return;
                });

                const mockManager: MockEntityManager = { delete: deleteImpl };

                return await callback(mockManager);
            }),
        } as any,
    };

    return repo;
};
