import { Injectable, BadRequestException, UnauthorizedException } from "@nestjs/common";
import { UsersService } from "@hms-module/modules/users/services/users.service";
import { OneTimeTokensService } from "@hms-module/modules/one-time-tokens/one-time-tokens.service";
import { MailService } from "@hms-module/modules/mail/mail.service";
import { ConfigService } from "@nestjs/config";
import { BetterLogger } from "@hms-module/modules/better-logger/better-logger.service";
import { AdminUser } from "@hms-module/modules/users/entities/admin-user.entity";
import { TokenType } from "@hms-module/modules/one-time-tokens/types/token-types.enum";

@Injectable()
export class CreateAdminInviteUseCase {
    constructor(
        private readonly users: UsersService,
        private readonly ott: OneTimeTokensService,
        private readonly mail: MailService,
        private readonly config: ConfigService,
        private readonly logger: BetterLogger,
    ) { }

    async execute(
        inviter: AdminUser,
        inviteeEmail: string,
        ttlMs: number = 1000 * 60 * 60 * 24,
    ): Promise<{ token: string; expires_at: Date; }> {
        if (!(inviter instanceof AdminUser)) {
            throw new UnauthorizedException(
                "Only administrators can invite new administrators."
            );
        }

        const normalizedEmail = inviteeEmail.trim().toLowerCase();

        const existing = await this.users.findAdminByEmail(normalizedEmail);
        if (existing) {
            throw new BadRequestException("Admin with this email already exists.");
        }

        const ott = await this.ott.create(
            { inviter_id: inviter.id, invitee_email: normalizedEmail },
            ttlMs,
            { type: TokenType.ALPHANUMERIC, length: 64 },
        );

        const expiresAt = new Date(ott.expiresAt);
        const inviteUrl = this.buildAdminInviteUrl(ott.token);
        const ctx = this.buildAdminInviteTemplateContext(
            inviter,
            normalizedEmail,
            inviteUrl,
            expiresAt,
        );

        const sent = await this.mail.sendTemplated({
            to: normalizedEmail,
            template_key: "emails/admin/auth/create-your-admin-account",
            context: ctx,
            headers: {
                "X-Email-Category": "admin-invite",
                "X-Inviter-Id": inviter.id,
            },
        });

        if (!sent) {
            this.logger.warn(`Admin invite email failed to ${normalizedEmail}`);
        }

        return { token: ott.token, expires_at: expiresAt };
    }

    // ===== helpers (kept here to avoid coupling with AuthService) =====

    private buildAdminInviteUrl(token: string): string {
        const host = this.config.get<string>("HMS_ADMIN_PANEL_HOST") ?? "localhost";
        const adminPanelPortRaw = this.config.get<string | number>(
            "HMS_ADMIN_PANEL_PORT",
        );
        const environment = this.config.get<string>("APP_ENVIRONMENT");
        const protocol = environment === "production" ? "https" : "http";

        const adminPanelPort =
            adminPanelPortRaw === undefined || adminPanelPortRaw === null
                ? undefined
                : Number(adminPanelPortRaw);

        // Production must never append the port to the origin.
        // In non-production (development/test) environments, include the port
        // only when it's a valid number and not 80.
        const includePort =
            environment !== "production" &&
            typeof adminPanelPort === "number" &&
            !Number.isNaN(adminPanelPort) &&
            adminPanelPort !== 80;

        const origin = includePort
            ? `${protocol}://${host}:${adminPanelPort}`
            : `${protocol}://${host}`;

        const url = new URL("/auth/create-admin-account", origin);
        url.searchParams.set("token", token);
        return url.toString();
    }

    private buildAdminInviteTemplateContext(
        inviter: AdminUser,
        inviteeEmail: string,
        inviteUrl: string,
        expiresAt: Date,
    ): Record<string, unknown> {
        const appName = this.config.get<string>("APP_NAME") ?? "Streaming Games";
        const environment = this.config.get<string>("APP_ENVIRONMENT") ?? "production";
        return {
            appName,
            inviteeEmail,
            inviterName: inviter.name ?? inviter.email,
            inviteUrl,
            expiresAtIso: expiresAt.toISOString(),
            expiresAtDate: expiresAt.toDateString(),
            expiresAtTime: expiresAt.toTimeString(),
            environment,
        };
    }
}
