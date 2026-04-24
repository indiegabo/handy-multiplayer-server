// ./test/hms/entities/one-time-tokens.mock.ts
// English-only code and comments by project convention.

import { OneTimeToken } from
    '@hms-module/modules/one-time-tokens/types/one-time-token.class';
import { USERS_MOCK } from './users.mock';

type TokenData = {
    purpose?: 'password_reset' | 'email_verification' | 'login_confirmation';
    user_id?: string | null;
    email?: string;
    temp_data?: string;
};

function nowMs(): number {
    return Date.now();
}

/**
 * Build a OneTimeToken instance with relative or absolute times.
 */
function makeToken(opts: {
    token: string;
    data?: TokenData;
    // If you pass expiresInMs, createdAtMs defaults to now().
    // If you pass absolute timestamps, both are used as-is.
    expiresInMs?: number;
    createdAgoMs?: number;
    expiresAtMs?: number;
    createdAtMs?: number;
}): OneTimeToken<TokenData> {
    const created =
        opts.createdAtMs ??
        (opts.createdAgoMs != null ? nowMs() - opts.createdAgoMs : nowMs());

    const expires =
        opts.expiresAtMs ??
        (opts.expiresInMs != null ? created + opts.expiresInMs : created + 5 * 60_000);

    return new OneTimeToken<TokenData>(
        opts.token,
        opts.data,
        expires,
        created,
    );
}

/**
 * Tokens:
 * - token-for-user-1-valid: válido por ~5min a partir de 1min atrás
 * - token-for-user-2-expired: expirado há ~10min
 * - token-without-user-valid: sem usuário, válido por ~1h
 * - another-token-for-user-1: válido por ~30min
 */
export const ONE_TIME_TOKENS_MOCK: Array<
    OneTimeToken<TokenData>
> = [
        makeToken({
            token: 'token-for-user-1-valid',
            data: {
                purpose: 'password_reset',
                user_id: USERS_MOCK[0].id,
                email: USERS_MOCK[0].email,
            },
            createdAgoMs: 1 * 60_000,     // created 1 min ago
            expiresInMs: 5 * 60_000,      // +5 min
        }),
        makeToken({
            token: 'token-for-user-2-expired',
            data: {
                purpose: 'email_verification',
                user_id: USERS_MOCK[1].id,
                email: USERS_MOCK[1].email,
            },
            // created 15 min ago, expired 10 min ago
            createdAgoMs: 15 * 60_000,
            expiresAtMs: nowMs() - 10 * 60_000,
        }),
        makeToken({
            token: 'token-without-user-valid',
            data: {
                temp_data: 'some_guest_session_info',
                user_id: null,
            },
            createdAgoMs: 5 * 60_000,     // created 5 min ago
            expiresInMs: 60 * 60_000,     // +1h
        }),
        makeToken({
            token: 'another-token-for-user-1',
            data: {
                purpose: 'login_confirmation',
                user_id: USERS_MOCK[0].id,
                email: USERS_MOCK[0].email,
            },
            createdAgoMs: 2 * 60_000,     // created 2 min ago
            expiresInMs: 30 * 60_000,     // +30 min
        }),
    ];

/**
 * Useful helpers for tests that persist tokens.
 */
export const ONE_TIME_TOKENS_PLAIN = ONE_TIME_TOKENS_MOCK
    .map(t => t.toPlain());

export function findToken(token: string): OneTimeToken<TokenData> | undefined {
    return ONE_TIME_TOKENS_MOCK.find(t => t.token === token);
}

export function isExpired(t: OneTimeToken<any>): boolean {
    return t.expiresAt <= nowMs();
}
