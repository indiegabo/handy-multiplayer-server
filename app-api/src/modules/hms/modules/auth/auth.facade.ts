import { Injectable } from "@nestjs/common";
import { EntityManager } from "typeorm";
import { Request as InterceptedRequest } from "express";

import { DeviceInfo } from "./types/device-info.type";
import { TwoFactorMethod } from "./types/two-factor-method.type";

import {
    LoginAdminPayload,
    AdminCreationFromInvitePayload,
} from "./payloads/admin-auth.payload";

import { TwitchPayload } from "./twitch/twitch.payload";
import { TwitchAuthProviderData } from "./twitch/twitch-auth-provider-data";

import {
    AdminUserAuthInfoDto,
    LoginResponseDto,
    Prepare2FAAccountCreationResponseDto,
    Prepared2FAResponseDto,
    RefreshTokenResponseDto,
    Requires2FAResponseDto,
    SendLoginCodeResponseDto,
    SingleStepLoginResponseDto,
    UserAuthInfoDto,
} from "@hms/shared-types/hms";

import { User } from "@hms-module/modules/users/entities/user.entity";
import { AdminUser } from "../users/entities/admin-user.entity";

/* ========================= */
/* ===== Use-case layer ==== */
/* ========================= */

import { LoginUseCase } from "./services/use-cases/login.usecase";
import { Prepare2FAUseCase }
    from "./services/use-cases/prepare-2fa.usecase";
import { Complete2FALoginUseCase }
    from "./services/use-cases/complete-2fa-login.usecase";
import { RefreshUseCase } from "./services/use-cases/refresh.usecase";
import { LogoutUseCase } from "./services/use-cases/logout.usecase";

import { CreateAdminInviteUseCase }
    from "./services/use-cases/admin-invite/create-admin-invite.usecase";
import { PrepareAdminAccountCreationUseCase }
    from "./services/use-cases/admin-invite/prepare-admin-account-creation.usecase";
import { CreateAdminFromInviteUseCase }
    from "./services/use-cases/admin-invite/create-admin-from-invite.usecase";

import { ValidateOrCreateUserFromTwitchUseCase }
    from "./services/use-cases/twitch/validate-or-create-user-from-twitch.usecase";
import { GetTwitchAuthDataUseCase }
    from "./services/use-cases/twitch/get-twitch-auth-data.usecase";

import { Generate2FASetupForUserUseCase }
    from "./services/use-cases/twofa/generate-setup-for-user.usecase";
import { Generate2FASetupByEmailUseCase }
    from "./services/use-cases/twofa/generate-setup-by-email.usecase";
import { CompleteAdmin2FASetupUseCase }
    from "./services/use-cases/twofa/complete-admin-setup.usecase";
import { ValidateOneTimeTokenUseCase }
    from "./services/use-cases/twofa/validate-one-time-token.usecase";

import { AuthenticateRequestUseCase }
    from "./services/use-cases/authenticate-request.usecase";
import { ClaimUsernameUseCase }
    from "./services/use-cases/user/claim-username.usecase";
import { RequestAdminLoginEmailUseCase }
    from "./services/use-cases/admin/request-admin-login-email.usecase";
import { RequestEndUserLoginEmailUseCase }
    from "./services/use-cases/end-user/request-end-user-login-email.usecase";

/**
 * Orchestrates authentication flows for end users and admins.
 *
 * This facade exposes cohesive entry points while delegating business
 * logic to use-cases. Public method groups mirror the constructor
 * dependency groupings for quick navigation and maintainability.
 */
@Injectable()
export class AuthFacade {
    /* ========= Constructor deps grouped by domain ========= */

    // --- Authentication & tokens ---
    constructor(
        private readonly loginUC: LoginUseCase,
        private readonly prepare2FALoginUC: Prepare2FAUseCase,
        private readonly complete2FALoginUC: Complete2FALoginUseCase,
        private readonly refreshUC: RefreshUseCase,
        private readonly logoutUC: LogoutUseCase,

        // --- Admin invite & onboarding ---
        private readonly createAdminInviteUC: CreateAdminInviteUseCase,
        private readonly prepareAdminCreationUC:
            PrepareAdminAccountCreationUseCase,
        private readonly createAdminFromInviteUC:
            CreateAdminFromInviteUseCase,

        // --- Twitch integration ---
        private readonly twitchValidateOrCreateUC:
            ValidateOrCreateUserFromTwitchUseCase,
        private readonly twitchGetAuthDataUC: GetTwitchAuthDataUseCase,

        // --- 2FA setup (account-level, not login step) ---
        private readonly gen2FAForUserUC: Generate2FASetupForUserUseCase,
        private readonly gen2FAByEmailUC: Generate2FASetupByEmailUseCase,
        private readonly completeAdmin2FAUC: CompleteAdmin2FASetupUseCase,
        private readonly validateOTTUC: ValidateOneTimeTokenUseCase,

        // --- Misc / cross-cutting ---
        private readonly authenticateRequestUC: AuthenticateRequestUseCase,
        private readonly claimUsernameUC: ClaimUsernameUseCase,
        private readonly requestAdminLoginEmailUC:
            RequestAdminLoginEmailUseCase,
        private readonly requestEndUserLoginEmailUC?:
            RequestEndUserLoginEmailUseCase,
    ) { }

    /* ============================ */
    /* ===== 1) Authentication ==== */
    /* ============================ */

    /**
     * Executes a login attempt for end user or admin. May return a direct
     * session (single step) or a second step requirement (2FA).
     *
     * @param payload Arbitrary provider payload. For local, may include
     *  credentials; for OAuth, provider tokens; etc.
     * @param userType Target audience: "end_user" or "admin".
     * @param deviceInfo Device and client metadata for risk controls.
     * @param provider Authentication provider identifier.
     * @returns Single step success or 2FA challenge descriptor.
     */
    async login(
        payload: any,
        userType: "end_user" | "admin",
        deviceInfo: DeviceInfo,
        provider: string,
    ): Promise<SingleStepLoginResponseDto | Requires2FAResponseDto> {
        return this.loginUC.execute(
            payload,
            userType,
            deviceInfo,
            provider,
        );
    }

    /* ====================== */
    /* ===== 2) Tokens ====== */
    /* ====================== */

    /**
     * Exchanges a refresh token for a new access/refresh pair.
     *
     * @param token Refresh token string.
     * @returns New access and refresh tokens, plus metadata.
     */
    async refresh(
        token: string,
        deviceInfo?: DeviceInfo,
    ): Promise<RefreshTokenResponseDto> {
        return this.refreshUC.execute(token, deviceInfo);
    }

    /**
     * Invalidates a refresh token (logout) for the given principal.
     *
     * @param user Authenticated principal (end user or admin).
     * @param refreshToken The refresh token to invalidate.
     */
    async logout(
        user: User | AdminUser,
        refreshToken: string,
    ): Promise<void> {
        return this.logoutUC.execute(user, refreshToken);
    }

    /* ==================================== */
    /* ===== 3) 2FA Login (second step) === */
    /* ==================================== */

    /**
     * Prepares a second-step 2FA challenge for an ongoing login.
     *
     * @param secondStepToken Opaque token referencing the pending login.
     * @param method Desired 2FA method to challenge with.
     * @returns A prepared challenge (e.g., email sent, TOTP expected).
     */
    async prepare2FALogin(
        secondStepToken: string,
        method: TwoFactorMethod,
    ): Promise<Prepared2FAResponseDto> {
        return this.prepare2FALoginUC.execute(
            secondStepToken,
            method,
        );
    }

    /**
     * Completes the second step of a 2FA login.
     *
     * @param secondStepToken Opaque token referencing the pending login.
     * @param code Verification code (e.g., TOTP or emailed code).
     * @param backupCode Optional backup code to use instead of `code`.
     * @returns Successful login response with tokens and user info.
     */
    async completeStep2FALogin(
        secondStepToken: string,
        code: string,
        backupCode?: string,
    ): Promise<LoginResponseDto> {
        return this.complete2FALoginUC.execute(
            secondStepToken,
            code,
            backupCode,
        );
    }

    /* ========================================= */
    /* ===== 4) 2FA Setup (account-level) ====== */
    /* ========================================= */

    /**
     * Generates 2FA setup data (QR + manual code) for a given user/admin.
     *
     * @param user Target principal for enabling 2FA.
     * @returns Setup bundle containing QR URL, manual entry, and setup token.
     */
    async generate2FASetupDataForUser(
        user: User | AdminUser,
    ): Promise<{
        qrCodeUrl: string;
        manualEntryCode: string;
        setupToken: string;
    }> {
        return this.gen2FAForUserUC.execute(user);
    }

    /**
     * Generates 2FA setup data by email and user type.
     *
     * @param email Principal email.
     * @param userType "end_user" or "admin".
     * @returns Setup bundle for enabling 2FA.
     */
    async generate2FASetupData(
        email: string,
        userType: "end_user" | "admin",
    ): Promise<{
        qrCodeUrl: string;
        manualEntryCode: string;
        setupToken: string;
    }> {
        return this.gen2FAByEmailUC.execute(email, userType);
    }

    /* ======================================= */
    /* ===== 5) Admin Invite & Onboarding ==== */
    /* ======================================= */

    /**
     * Creates an admin invite token for onboarding a new admin.
     *
     * @param inviter Admin who is issuing the invite.
     * @param inviteeEmail Email of the future admin.
     * @param ttlMs Time to live in milliseconds (default: 24h).
     * @returns Token and expiration date.
     */
    async createAdminInvite(
        inviter: AdminUser,
        inviteeEmail: string,
        ttlMs: number = 1000 * 60 * 60 * 24,
    ): Promise<{ token: string; expires_at: Date; }> {
        return this.createAdminInviteUC.execute(
            inviter,
            inviteeEmail,
            ttlMs,
        );
    }

    /**
     * Prepares the 2FA setup for admin account creation from an invite.
     *
     * @param invite_token Admin invite token.
     * @returns Data to proceed with account creation (2FA bootstrap).
     */
    async prepareAdminAccountCreation(
        invite_token: string,
    ): Promise<Prepare2FAAccountCreationResponseDto> {
        return this.prepareAdminCreationUC.execute(invite_token);
    }

    /**
     * Completes admin creation from a valid invite.
     *
     * @param payload Data from the invite flow, including 2FA.
     * @returns Backup codes and the authenticated admin info.
     */
    async createAdminFromInvite(
        payload: AdminCreationFromInvitePayload,
    ): Promise<{
        backup_codes: string[];
        admin: AdminUserAuthInfoDto;
    }> {
        return this.createAdminFromInviteUC.execute(payload);
    }

    /* ====================================== */
    /* ===== 6) Admin 2FA (post-onboard) ==== */
    /* ====================================== */

    /**
     * Generates 2FA setup bundle for an admin by email.
     * Convenience wrapper around the email-based generator.
     *
     * @param email Admin email.
     * @returns Setup bundle for enabling 2FA.
     */
    async generateAdmin2FASetupData(
        email: string,
    ): Promise<{
        qrCodeUrl: string;
        manualEntryCode: string;
        setupToken: string;
    }> {
        return this.gen2FAByEmailUC.execute(email, "admin");
    }

    /**
     * Completes the admin 2FA setup by verifying the code.
     *
     * @param user Admin principal who is enabling 2FA.
     * @param setupToken Opaque token from the setup step.
     * @param verificationCode Code generated by the 2FA app.
     * @param manager Optional transaction manager.
     * @returns Array of backup codes generated upon success.
     */
    async completeAdmin2FASetup(
        user: User | AdminUser,
        setupToken: string,
        verificationCode: string,
        manager?: EntityManager,
    ): Promise<string[]> {
        return this.completeAdmin2FAUC.execute(
            user,
            setupToken,
            verificationCode,
            manager,
        );
    }

    /**
     * Sends a passwordless login email for admins.
     *
     * @param payload Object containing the admin email.
     */
    async requestAdminLoginEmail(
        payload: { email: string },
    ): Promise<void> {
        return this.requestAdminLoginEmailUC.execute(payload);
    }

    /**
     * Sends an end-user login code using an email or username term.
     *
     * - Email terms create an end-user when missing.
     * - Username terms only dispatch code when the user exists.
     *
     * @param term Email or username term from client.
     */
    async requestEndUserLoginEmail(
        term: string,
    ): Promise<SendLoginCodeResponseDto> {
        return this.requestEndUserLoginEmailUC.execute(term);
    }

    /* ============================= */
    /* ===== 7) User Profile ======= */
    /* ============================= */

    /**
     * Claims a username for the given end user.
     *
     * @param user End user principal.
     * @param username Desired unique username.
     */
    async claimUsername(
        user: User,
        username: string,
    ): Promise<void> {
        return this.claimUsernameUC.execute(user, username);
    }

    /* ============================ */
    /* ===== 8) Twitch OAuth ====== */
    /* ============================ */

    /**
     * Validates or creates a user based on a Twitch profile payload.
     *
     * @param payload Twitch identity payload.
     * @returns The upserted end user.
     */
    async validateOrCreateUserFromTwitchProfile(
        payload: TwitchPayload,
    ): Promise<User> {
        return this.twitchValidateOrCreateUC.execute(payload);
    }

    /**
     * Retrieves Twitch auth provider data for a user.
     *
     * @param user End user principal.
     * @returns Provider metadata (scopes, linked state, etc.).
     */
    async getTwitchAuthData(
        user: User,
    ): Promise<TwitchAuthProviderData> {
        return this.twitchGetAuthDataUC.execute(user);
    }

    /* ===================================== */
    /* ===== 9) Request authentication ===== */
    /* ===================================== */

    /**
     * Authenticates an incoming HTTP request and returns the principal.
     *
     * @param request Express request intercepted by middleware/guard.
     * @returns The authenticated user or admin.
     */
    async authenticateRequest(
        request: InterceptedRequest,
    ): Promise<User | AdminUser> {
        return this.authenticateRequestUC.execute(request);
    }

    /* ====================================== */
    /* ===== 10) One-Time Token (OTT) ======= */
    /* ====================================== */

    /**
     * Validates a One-Time Token used to resume a login flow.
     *
     * @param token One-time token string.
     * @returns The validated token and associated principal.
     */
    async validateOneTimeTokenForLogin(
        token: string,
    ): Promise<{
        token: string;
        user: User | AdminUser;
    }> {
        return this.validateOTTUC.execute(token);
    }
}
