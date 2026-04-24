import { Injectable, UnauthorizedException } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import * as crypto from "crypto";
import * as bcrypt from "bcrypt";
import { authenticator as otpAuthenticator } from "otplib";
import * as QRCode from "qrcode";

import { UsersService } from "@hms-module/modules/users/services/users.service";
import { User } from "@hms-module/modules/users/entities/user.entity";
import { AdminUser } from "../../users/entities/admin-user.entity";
import { UserTwoFactorMethod }
    from "../../users/entities/user-two-factor-method.entity";
import { SessionStorePort } from "./ports/session-store.port";
import {
    StoredTwoFactorData,
    TwoFactorMethod,
} from "../types/two-factor-method.type";
import { TwoFAHandler } from "../two-fa-handling/twofa-handler";
import { TwoFactorMethodNotSupportedException }
    from "../exceptions/two-factor-method-not-supported.exception";
import { AUTH_CONFIG } from "@src/config/hms/auth.config";
import { ConfigService } from "@nestjs/config";
import { OneTimeTokensService } from "../../one-time-tokens/one-time-tokens.service";
import { MailService } from "../../mail/mail.service";

/**
 * Central 2FA service:
 * - Manage active methods and primary selection.
 * - Prepare/validate 2FA challenges via handlers.
 * - Manage backup codes (validate/consume).
 * - Manage setup flow (QR, secret) and persistence.
 * - Manage short-lived 2FA login sessions in a store (Redis).
 */
@Injectable()
export class TwoFAService {
    private readonly twoFAHandlers: Map<TwoFactorMethod, TwoFAHandler>
        = new Map<TwoFactorMethod, TwoFAHandler>();

    constructor(
        private readonly users: UsersService,
        private readonly sessions: SessionStorePort,
        private readonly config: ConfigService,
    ) { }

    /**
     * Registry wiring (called by AuthService.onModuleInit or Module).
     */
    registerHandlers(
        entries: Array<{ type: new (...a: any[]) => TwoFAHandler }>,
        deps: {
            users: UsersService;
            oneTimeTokens: OneTimeTokensService;
            mailService: MailService;
        }
    ): void {
        for (const entry of entries) {
            const handler = new entry.type(
                deps.users,
                deps.oneTimeTokens,
                deps.mailService,
            );
            this.twoFAHandlers.set(handler.method, handler);
        }
    }

    // ===== Methods directory =====

    async getActiveMethods(
        userId: string,
        userType: "end_user" | "admin"
    ): Promise<UserTwoFactorMethod[]> {
        return this.users.getUserActive2FAMethods(userId, userType);
    }

    pickPrimaryOrEmail(
        methods: UserTwoFactorMethod[]
    ): TwoFactorMethod {
        const primary = methods.find(m => m.is_primary);
        return primary ? primary.method_type : TwoFactorMethod.EMAIL;
    }

    listAvailableIncludingEmail(
        methods: UserTwoFactorMethod[]
    ): TwoFactorMethod[] {
        const list = methods.map(m => m.method_type);
        if (!list.includes(TwoFactorMethod.EMAIL)) list.push(TwoFactorMethod.EMAIL);
        return list;
    }

    // ===== Prepare/Validate during login =====

    async storeLogin2FA(
        secondStepToken: string,
        data: StoredTwoFactorData
    ): Promise<void> {
        await this.sessions.setJson(
            `2fa:login:${secondStepToken}`,
            data,
            15 * 60,
        );
    }

    async getLogin2FA(
        secondStepToken: string
    ): Promise<StoredTwoFactorData | null> {
        return this.sessions.getJson<StoredTwoFactorData>(
            `2fa:login:${secondStepToken}`,
        );
    }

    async clearLogin2FA(
        secondStepToken: string
    ): Promise<void> {
        await this.sessions.del(`2fa:login:${secondStepToken}`);
    }

    async prepareWithHandler(
        user: User | AdminUser,
        method: TwoFactorMethod,
        data: StoredTwoFactorData
    ): Promise<{ message: string }> {
        const handler = this.twoFAHandlers.get(method);
        if (!handler) throw new TwoFactorMethodNotSupportedException();
        const res = await handler.prepare(user, data);
        return { message: res.message };
    }

    async validateWithHandler(
        data: StoredTwoFactorData,
        code: string
    ): Promise<boolean> {
        const handler = this.twoFAHandlers.get(data.current_method);
        if (!handler) throw new TwoFactorMethodNotSupportedException();
        return handler.validate(data, code);
    }

    // ===== Backup codes (AUTHENTICATOR method) =====

    async validateAndConsumeBackupCode(
        user: User | AdminUser,
        backupCode: string,
        twoFAMethod: TwoFactorMethod
    ): Promise<void> {
        const method = await this.users.findUser2FAMethod(
            user.id,
            user instanceof AdminUser ? "admin" : "end_user",
            twoFAMethod
        );

        if (!method || !method.metadata?.backupCodes) {
            throw new UnauthorizedException("No backup codes available");
        }

        const list = method.metadata.backupCodes as Array<{
            code: string; used: boolean; used_at?: Date;
        }>;

        const match = list.find(bc => bc.code === backupCode && !bc.used);
        if (!match) {
            throw new UnauthorizedException("Invalid or already used backup code");
        }

        match.used = true;
        match.used_at = new Date();

        await this.users.update2FAMethod(method.id, {
            metadata: { ...method.metadata, backupCodes: list },
        });
    }

    // ===== Setup (QR/secret) for admin/end_user =====

    async generateSetupDataForUser(
        user: User | AdminUser
    ): Promise<{
        qrCodeUrl: string;
        manualEntryCode: string;
        setupToken: string;
    }> {
        const isEndUser = user instanceof User;
        const issuer = isEndUser
            ? this.config.get("APP_NAME")
            : "[Admin] " + this.config.get("APP_NAME");
        return this.generateSetupDataInternal(user.email, issuer);
    }

    async generateSetupData(
        email: string,
        userType: "end_user" | "admin"
    ): Promise<{
        qrCodeUrl: string;
        manualEntryCode: string;
        setupToken: string;
    }> {
        const issuer = userType === "end_user"
            ? this.config.get("APP_NAME")
            : "[Admin] " + this.config.get("APP_NAME");
        return this.generateSetupDataInternal(email, issuer);
    }

    async generateAdminSetupData(
        email: string
    ): Promise<{
        qrCodeUrl: string;
        manualEntryCode: string;
        setupToken: string;
    }> {
        return this.generateSetupDataInternal(
            email,
            "[Admin] " + this.config.get("APP_NAME"),
        );
    }

    async completeSetup(
        user: User | AdminUser,
        setupToken: string,
        verificationCode: string,
        entityManager: any, // EntityManager | DataSource
    ): Promise<string[]> {
        const setupData = await this.sessions.getJson<{
            secret: string; email: string;
        }>(`2fa:setup:${setupToken}`);

        if (!setupData) {
            throw new Error("2FA setup data not found or expired");
        }

        if (setupData.email !== user.email) {
            throw new Error("Email mismatch in 2FA setup");
        }

        const isValid = otpAuthenticator.check(verificationCode, setupData.secret);
        if (!isValid) {
            throw new UnauthorizedException("Invalid 2FA verification code");
        }

        const backupCodes = Array.from({ length: 10 }, () =>
            crypto.randomBytes(4)
                .toString("hex")
                .slice(0, 8)
                .toUpperCase()
        );

        const hashedBackupCodes = await Promise.all(
            backupCodes.map(code =>
                bcrypt.hash(code, AUTH_CONFIG.passwords.saltRounds)
            )
        );

        const twoFactorMethod = new UserTwoFactorMethod();
        twoFactorMethod.user_id = user.id;
        twoFactorMethod.user_type = user instanceof User ? "end_user" : "admin";
        twoFactorMethod.method_type = TwoFactorMethod.AUTHENTICATOR;
        twoFactorMethod.secret_data = setupData.secret;
        twoFactorMethod.is_enabled = true;
        twoFactorMethod.is_primary = true;
        twoFactorMethod.metadata = {
            generated_at: new Date(),
            verified_at: new Date(),
            algorithm: "SHA1",
            digits: 6,
            period: 30,
            backup_codes: hashedBackupCodes,
        };

        await entityManager
            .getRepository(UserTwoFactorMethod)
            .save(twoFactorMethod);

        if (!user.two_factor_enabled) {
            await entityManager.getRepository(
                user instanceof User ? User : AdminUser
            ).update(user.id, { two_factor_enabled: true });
            (user as any).two_factor_enabled = true;
        }

        await this.sessions.del(`2fa:setup:${setupToken}`);
        return backupCodes;
    }

    // ===== internals =====

    private async generateSetupDataInternal(
        email: string,
        issuer: string
    ): Promise<{
        qrCodeUrl: string;
        manualEntryCode: string;
        setupToken: string;
    }> {
        otpAuthenticator.options = {
            issuer,
            label: email,
            digits: 6,
            step: 30,
        };

        const secret = otpAuthenticator.generateSecret();
        const otpauthUrl = otpAuthenticator.keyuri(email, issuer, secret);
        const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);
        const setupToken = uuidv4();

        await this.sessions.setJson(
            `2fa:setup:${setupToken}`,
            { secret, email },
            15 * 60,
        );

        return {
            qrCodeUrl,
            manualEntryCode: otpauthUrl,
            setupToken,
        };
    }
}
