import { Injectable, OnDestroy } from '@angular/core';
import {
  HttpClient,
  HttpContext,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import {
  BehaviorSubject,
  Observable,
  Subscription,
  throwError,
} from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { JwtHelperService } from '@auth0/angular-jwt';
import {
  AdminAccountCreationStartPayload,
  AdminCreationFromInvitePayload,
  AdminCreationPayload,
  AdminUserAuthInfoDto,
  CreateAdminAccountResponseDto,
  CreateAdminInvitePayload,
  CreateAdminInviteResponseDto,
  LoginResponseDto,
  Prepare2FAAccountCreationResponseDto,
  Prepared2FAResponseDto,
  Requires2FAResponseDto,
  SingleStepLoginResponseDto,
  TwoFactorMethod,
} from '@hms/shared-types/hms';
import { TokenStoreService } from
  'src/app/core/services/token-store.service';
import { ApiResponse } from '@hms/shared-types/hms';
import { SUPPRESS_ERROR_ALERT } from '../../interceptors/http-context-tokens';

export type RefreshTokenResponse = {
  access_token: string;
  refresh_token: string;
};

export type ProcessedLoginResponse = {
  requires2FA?: boolean;
  user?: AdminUserAuthInfoDto;
  twofa?: {
    second_step_token: string;
    method: TwoFactorMethod;
    message: string;
    available_2fa_methods: TwoFactorMethod[];
  };
};

/**
 * AuthService
 *  - Handles login/2FA flows.
 *  - Manages tokens via TokenStoreService (memory + storage).
 *  - Tracks auth state and current user.
 *  - Exposes helpers for logout and token refresh.
 *
 * Notes
 *  - All token reads/writes are centralized in TokenStoreService.
 *  - This service keeps user info in localStorage.
 */
@Injectable({ providedIn: 'root' })
export class AuthService implements OnDestroy {
  // ──────────────────────────────────────────────────────────────────────────
  // Constants / Keys
  // ──────────────────────────────────────────────────────────────────────────
  private readonly USER_KEY = `${environment.appPrefix}_user`;

  // ──────────────────────────────────────────────────────────────────────────
  // Internals
  // ──────────────────────────────────────────────────────────────────────────
  private subs = new Subscription();
  private jwtHelper = new JwtHelperService();

  private currentUser$ =
    new BehaviorSubject<AdminUserAuthInfoDto | null>(
      this.getStoredUser(),
    );

  private isAuthenticated$ =
    new BehaviorSubject<boolean>(this.hasValidToken());

  // ──────────────────────────────────────────────────────────────────────────
  // Ctor / Teardown
  // ──────────────────────────────────────────────────────────────────────────
  constructor(
    private http: HttpClient,
    private router: Router,
    private tokenStore: TokenStoreService,
  ) {
    // React to token changes (multi-tab + in-app updates).
    this.subs.add(
      this.tokenStore.accessToken$.subscribe((access) => {
        const wasAuth = this.isAuthenticated$.getValue();
        const isAuth = !!access && !this.jwtHelper.isTokenExpired(access);
        this.isAuthenticated$.next(isAuth);

        // If we lost token, clear user but avoid navigation loops
        // in places where router guards might already redirect.
        if (!isAuth && wasAuth) {
          this.clearUserOnly();
        }
      }),
    );
  }

  /** Cleanup subscriptions. */
  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Public API — Auth Flows (Login / 2FA)
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Performs email/password login.
   */
  login(
    email: string,
    password: string,
  ): Observable<ProcessedLoginResponse> {
    return this.http
      .post<ApiResponse<SingleStepLoginResponseDto | Requires2FAResponseDto>>(
        `${environment.api.baseUrl}/admin-auth/login`,
        { email, password },
        { headers: this.getHeaders() },
      )
      .pipe(
        map((response) => this.processLoginResponse(response.data)),
        catchError((error) => {
          console.error('Login error:', error);
          return throwError(() => error);
        }),
      );
  }

  /**
   * Performs one-time-token login.
   */
  loginWithOtt(ott: string): Observable<ProcessedLoginResponse> {
    return this.http
      .post<ApiResponse<SingleStepLoginResponseDto | Requires2FAResponseDto>>(
        `${environment.api.baseUrl}/admin-auth/login-ott`,
        { token: ott },
        { headers: this.getHeaders() },
      )
      .pipe(
        map((response) => this.processLoginResponse(response.data)),
        catchError((error) => {
          console.error('OTT login error:', error);
          return throwError(() => error);
        }),
      );
  }

  /**
   * Chooses a 2FA method.
   */
  choose2FAMethod(
    twofa_token: string,
    twofa_method: TwoFactorMethod,
  ): Observable<Prepared2FAResponseDto> {
    return this.http
      .post<ApiResponse<Prepared2FAResponseDto>>(
        `${environment.api.baseUrl}/admin-auth/choose-2fa-method`,
        { second_step_token: twofa_token, twofa_method },
        { headers: this.getHeaders() },
      )
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          console.error('2FA method selection error:', error);
          return throwError(() => error);
        }),
      );
  }

  /**
   * Completes 2FA login with verification code.
   */
  complete2FALogin(
    twofa_token: string,
    code: string,
  ): Observable<AdminUserAuthInfoDto> {
    return this.http
      .post<ApiResponse<LoginResponseDto>>(
        `${environment.api.baseUrl}/admin-auth/complete-2fa-login`,
        { second_step_token: twofa_token, code },
        { headers: this.getHeaders() },
      )
      .pipe(
        map((response) => response.data),
        tap((response) => this.handleLoginSuccess(response)),
        map((response) => response.user as AdminUserAuthInfoDto),
        catchError((error) => throwError(() => error)),
      );
  }

  /**
   * Completes 2FA login using a backup code.
   */
  complete2FALoginWithBackupCode(
    twofa_token: string,
    code: string,
  ): Observable<AdminUserAuthInfoDto> {
    return this.http
      .post<ApiResponse<LoginResponseDto>>(
        `${environment.api.baseUrl}/admin-auth/backup-code-2fa`,
        { second_step_token: twofa_token, code },
        { headers: this.getHeaders() },
      )
      .pipe(
        map((response) => response.data),
        tap((response) => this.handleLoginSuccess(response)),
        map((response) => response.user as AdminUserAuthInfoDto),
        catchError((error) => throwError(() => error)),
      );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Public API — Admin Account Creation
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Starts admin account creation from invite.
   */
  startAdminAccountCreation(
    inviteToken: string,
  ): Observable<Prepare2FAAccountCreationResponseDto> {
    const payload: AdminAccountCreationStartPayload = {
      invite_token: inviteToken,
    };

    return this.http
      .post<ApiResponse<Prepare2FAAccountCreationResponseDto>>(
        `${environment.api.baseUrl}/admin-auth/start-admin-account-creation`,
        payload,
        { headers: this.getHeaders() },
      )
      .pipe(map((res) => res.data));
  }

  /**
   * Creates admin account from invite with provided data.
   */
  createAdminAccountFromInvite(
    inviteToken: string,
    data: AdminCreationPayload,
  ): Observable<CreateAdminAccountResponseDto> {
    const payload: AdminCreationFromInvitePayload = {
      ...data,
      invite_token: inviteToken,
    };

    return this.http
      .post<ApiResponse<CreateAdminAccountResponseDto>>(
        `${environment.api.baseUrl}/admin-auth/create-admin-account-from-invite`,
        payload,
        { headers: this.getHeaders() },
      )
      .pipe(map((res) => res.data));
  }

  /**
   * Creates an invitation for a new admin account.
   */
  createAdminInvite(
    payload: CreateAdminInvitePayload,
  ): Observable<CreateAdminInviteResponseDto> {
    return this.http
      .post<ApiResponse<CreateAdminInviteResponseDto>>(
        `${environment.api.baseUrl}/admin-auth/create-admin-invite`,
        payload,
        { headers: this.getHeaders() },
      )
      .pipe(map((res) => res.data));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Public API — State Accessors
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Returns the current user as an observable.
   */
  getCurrentUser(): Observable<AdminUserAuthInfoDto | null> {
    return this.currentUser$.asObservable();
  }

  /**
   * Returns the auth state as an observable.
   */
  checkAuthState(): Observable<boolean> {
    return this.isAuthenticated$.asObservable();
  }

  /**
   * Synchronous convenience getter for access token.
   * (Used by interceptors/guards if needed.)
   */
  getAccessToken(): string | null {
    return this.tokenStore.getTokens().accessToken;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Public API — Token / Session Management
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Refreshes access token using the refresh token.
   */
  refreshToken(): Observable<RefreshTokenResponse> {
    const { refreshToken } = this.tokenStore.getTokens();

    if (!refreshToken) {
      this.logout().subscribe();
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http
      .put<ApiResponse<RefreshTokenResponse>>(
        `${environment.api.baseUrl}/admin-auth/refresh-token`,
        { refresh_token: refreshToken },
        {
          headers: this.getHeaders(),
          context: new HttpContext().set(SUPPRESS_ERROR_ALERT, true),
        },
      )
      .pipe(
        map((response) => response.data),
        tap((data) => {
          if (!data?.access_token || !data?.refresh_token) {
            throw new Error('Invalid token response');
          }
          this.tokenStore.setAccessToken(data.access_token);
          this.tokenStore.setRefreshToken(data.refresh_token);
          this.isAuthenticated$.next(true);
        }),
        catchError((error) => throwError(() => error)),
      );
  }

  /**
   * Logs out user (API + local cleanup).
   */
  logout(): Observable<void> {
    const { accessToken, refreshToken } = this.tokenStore.getTokens();

    // Clear local state first for snappy UX.
    this.clearAuthData();

    if (accessToken && refreshToken) {
      return this.http
        .post<void>(
          `${environment.api.baseUrl}/admin-auth/logout`,
          { refresh_token: refreshToken },
          { headers: this.getAuthHeaders(accessToken) },
        )
        .pipe(
          tap(() => this.clearAuthData()),
          catchError((error) => throwError(() => error)),
        );
    }

    return new Observable((subscriber) => {
      subscriber.next();
      subscriber.complete();
    });
  }

  /**
   * Checks if access token is present and not expired.
   */
  hasValidToken(): boolean {
    const token = this.tokenStore.getTokens().accessToken;
    if (!token) return false;
    return !this.jwtHelper.isTokenExpired(token);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Private — Response Handling
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Normalizes login response into a ProcessedLoginResponse.
   */
  private processLoginResponse(
    response: SingleStepLoginResponseDto | Requires2FAResponseDto,
  ): ProcessedLoginResponse {
    const { requires_2fa } = response;

    if (!requires_2fa && 'access_token' in response) {
      const single = response as SingleStepLoginResponseDto;
      this.handleLoginSuccess(single);
      return { user: single.user as AdminUserAuthInfoDto };
    }

    if (requires_2fa && 'twofa' in response) {
      const r2 = response as Requires2FAResponseDto;
      return { requires2FA: true, twofa: r2.twofa };
    }

    throw new Error('Unexpected response from login API');
  }

  /**
   * Persists tokens and user, updates auth state.
   */
  private handleLoginSuccess(response: LoginResponseDto): void {
    if (!response?.access_token) {
      console.error('Invalid login response - missing access token');
      this.clearAuthData(false);
      return;
    }

    this.tokenStore.setAccessToken(response.access_token);

    if (response.refresh_token) {
      this.tokenStore.setRefreshToken(response.refresh_token);
    }

    this.setUser(response.user as AdminUserAuthInfoDto);
    this.isAuthenticated$.next(true);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Private — HTTP / Headers
  // ──────────────────────────────────────────────────────────────────────────
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Accept-Language': 'en',
      'Content-Type': 'application/json',
    });
  }

  private getAuthHeaders(token: string): HttpHeaders {
    return this.getHeaders().set('Authorization', `Bearer ${token}`);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Private — User Persistence
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Loads user from localStorage.
   */
  private getStoredUser(): AdminUserAuthInfoDto | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    if (!userJson) return null;
    try {
      return JSON.parse(userJson);
    } catch (error) {
      console.error('Failed to parse user from localStorage', error);
      this.clearAuthData(false);
      return null;
    }
  }

  /**
   * Persists user and emits subject.
   */
  private setUser(user: AdminUserAuthInfoDto): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUser$.next(user);
  }

  /**
   * Removes only the user payload (keeps navigation under control).
   */
  private clearUserOnly(): void {
    localStorage.removeItem(this.USER_KEY);
    this.currentUser$.next(null);
  }

  /**
   * Clears tokens, user, and can navigate to login if requested.
   */
  private clearAuthData(navigate: boolean = true): void {
    this.tokenStore.clearAll();
    this.clearUserOnly();
    this.isAuthenticated$.next(false);

    if (navigate) {
      this.router.navigate(['/auth/login'], { replaceUrl: true });
    }
  }

  /**
   * Handles 401 errors by cleaning local state.
   */
  // (Kept for parity with your original API; use when piping requests.)
  private handleError(error: HttpErrorResponse): Observable<never> {
    if (error.status === 401) {
      this.clearAuthData();
    }
    return throwError(() => error);
  }
}
