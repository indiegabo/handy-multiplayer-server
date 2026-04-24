import { Injectable, Injector } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import {
  Observable,
  throwError,
} from 'rxjs';
import {
  catchError,
  map,
  shareReplay,
  switchMap,
  finalize,
} from 'rxjs/operators';
import { AUTH_CONFIG } from 'src/app/config/auth';
import { TokenStoreService } from
  'src/app/core/services/token-store.service';
import { AuthService } from '../services/hms/auth.service';

/**
 * AuthInterceptor
 *  - Attaches Authorization header from TokenStoreService (memory cache).
 *  - On 401, attempts a single refresh flow (de-duplicated).
 *  - Respects whitelisted routes (no auth header / no refresh).
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private refreshInFlight$: Observable<string> | null = null;

  private authService: AuthService;

  constructor(
    private injector: Injector,
    private tokenStore: TokenStoreService,
  ) {
    // Injector indirection allows lazy resolution to avoid cycles.
    this.authService = this.injector.get(AuthService);
  }

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    if (this.isWhitelisted(request.url)) {
      return next.handle(request);
    }

    const token = this.tokenStore.getTokens().accessToken;

    // No token: just forward the request.
    if (!token) {
      return next.handle(request);
    }

    const authReq = this.addAuthHeader(request, token);

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          return this.handle401Error(authReq, next);
        }
        return throwError(() => error);
      }),
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────────────────────────────────

  private isWhitelisted(url: string): boolean {
    return AUTH_CONFIG.whitelistedRoutes.some((route) =>
      url.includes(route),
    );
  }

  private addAuthHeader<T>(
    request: HttpRequest<T>,
    token: string,
  ): HttpRequest<T> {
    return request.clone({
      headers: request.headers.set('Authorization', `Bearer ${token}`),
    });
  }

  /**
   * Handles 401 by performing a single refresh flow.
   * Concurrent requests wait for the same result via refreshSubject.
   */
  private handle401Error<T>(
    request: HttpRequest<T>,
    next: HttpHandler,
  ): Observable<HttpEvent<T>> {
    const { refreshToken } = this.tokenStore.getTokens();

    if (!refreshToken) {
      this.authService.logout().subscribe();
      return throwError(() => new Error('Missing refresh token'));
    }

    if (!this.refreshInFlight$) {
      this.refreshInFlight$ = this.authService.refreshToken().pipe(
        map((tokens) => {
          if (!tokens?.access_token) {
            throw new Error('Invalid refresh response');
          }

          return tokens.access_token;
        }),
        shareReplay(1),
        finalize(() => {
          this.refreshInFlight$ = null;
        }),
      );
    }

    return this.refreshInFlight$.pipe(
      switchMap((newToken) => {
        return next.handle(this.addAuthHeader(request, newToken));
      }),
      catchError((error) => {
        this.authService.logout().subscribe();
        return throwError(() => error);
      }),
    );
  }
}
