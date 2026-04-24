import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';

export interface TokenPair {
    accessToken: string | null;
    refreshToken: string | null;
}

/**
 * Keeps access/refresh tokens cached in memory and persisted in localStorage.
 * Also reacts to multi-tab changes via `storage` events.
 */
@Injectable({ providedIn: 'root' })
export class TokenStoreService implements OnDestroy {
    private readonly accessKey: string;
    private readonly refreshKey: string;

    private subs = new Subscription();

    private accessTokenSubject = new BehaviorSubject<string | null>(null);
    private refreshTokenSubject = new BehaviorSubject<string | null>(null);

    /** Emits current access token (or null). */
    readonly accessToken$: Observable<string | null> =
        this.accessTokenSubject.asObservable();

    /** Emits current refresh token (or null). */
    readonly refreshToken$: Observable<string | null> =
        this.refreshTokenSubject.asObservable();

    constructor() {
        // You can inject environment if you prefer; kept simple to avoid long lines.
        const appPrefix = (window as any).__APP_PREFIX__ ?? 'app';
        this.accessKey = `${appPrefix}_access_token`;
        this.refreshKey = `${appPrefix}_refresh_token`;

        // Initialize from localStorage.
        const access = this.normalize(localStorage.getItem(this.accessKey));
        const refresh = this.normalize(localStorage.getItem(this.refreshKey));
        this.accessTokenSubject.next(access);
        this.refreshTokenSubject.next(refresh);

        // Listen to multi-tab storage changes.
        const onStorage = (ev: StorageEvent) => {
            if (ev.key === this.accessKey) {
                this.accessTokenSubject.next(this.normalize(ev.newValue));
            }
            if (ev.key === this.refreshKey) {
                this.refreshTokenSubject.next(this.normalize(ev.newValue));
            }
        };
        window.addEventListener('storage', onStorage);
        this.subs.add({
            unsubscribe: () => window.removeEventListener('storage', onStorage),
        });
    }

    ngOnDestroy(): void {
        this.subs.unsubscribe();
    }

    /**
     * Returns current tokens synchronously from memory.
     */
    getTokens(): TokenPair {
        return {
            accessToken: this.accessTokenSubject.getValue(),
            refreshToken: this.refreshTokenSubject.getValue(),
        };
    }

    /**
     * Sets access token (updates memory + storage). Pass null to clear.
     */
    setAccessToken(token: string | null | undefined): void {
        const normalized = this.normalize(token);
        if (normalized) {
            localStorage.setItem(this.accessKey, normalized);
        } else {
            localStorage.removeItem(this.accessKey);
        }
        this.accessTokenSubject.next(normalized);
    }

    /**
     * Sets refresh token (updates memory + storage). Pass null to clear.
     */
    setRefreshToken(token: string | null | undefined): void {
        const normalized = this.normalize(token);
        if (normalized) {
            localStorage.setItem(this.refreshKey, normalized);
        } else {
            localStorage.removeItem(this.refreshKey);
        }
        this.refreshTokenSubject.next(normalized);
    }

    /**
     * Clears both tokens (memory + storage).
     */
    clearAll(): void {
        localStorage.removeItem(this.accessKey);
        localStorage.removeItem(this.refreshKey);
        this.accessTokenSubject.next(null);
        this.refreshTokenSubject.next(null);
    }

    private normalize(val: string | null | undefined): string | null {
        if (!val) return null;
        const trimmed = String(val).trim();
        if (
            trimmed.length === 0 ||
            trimmed.toLowerCase() === 'null' ||
            trimmed.toLowerCase() === 'undefined'
        ) {
            return null;
        }
        return trimmed;
    }
}
