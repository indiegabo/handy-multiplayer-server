import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { DataSource } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import * as crypto from "crypto";

import { User } from "@hms-module/modules/users/entities/user.entity";
import { AdminUser } from "../../users/entities/admin-user.entity";
import { UsersService } from "@hms-module/modules/users/services/users.service";
import { RefreshToken } from "../entities/refresh-token.entity";
import { RefreshTokenRepository } from "../repositories/refresh-token.repository";
import { DeviceInfo } from "../types/device-info.type";
import { RefreshTokenResponseDto } from "@hms/shared-types/hms";
import { AUTH_CONFIG } from "@src/config/hms/auth.config";

/**
 * Centralized token management (JWT + Refresh).
 *
 * Responsibilities:
 * - Sign access tokens (JWT).
 * - Issue refresh tokens and persist them.
 * - Exchange refresh token for new access + refresh.
 *
 * Notes:
 * - Keep this stateless (except DB writes for refresh tokens).
 * - Device fingerprint is embedded in JWT (if provided).
 */
@Injectable()
export class TokenService {
    constructor(
        private readonly jwt: JwtService,
        private readonly config: ConfigService,
        private readonly users: UsersService,
        private readonly refreshRepo: RefreshTokenRepository,
        private readonly dataSource: DataSource,
    ) { }

    /**
     * Signs a short-lived access token (JWT).
     * TODO: Add capabalities to tokens payloads.
     */
    signAccess(
        user: User | AdminUser,
        device?: DeviceInfo
    ): string {
        if (!user?.id || !("email" in user)) {
            throw new Error(
                "User must have id and email to sign an access token."
            );
        }

        const payload: Record<string, unknown> = {
            sub: user.id,
            email: (user as any).email,
            user_type: user instanceof User ? "end_user" : "admin",
            device_fp: this.fingerprint(device),
        };

        if (user instanceof User) {
            payload["username"] = user.username;
        }

        const cfg = this.getJwtConfigForUser(user);

        return this.jwt.sign(payload, {
            expiresIn: cfg.accessTokenExpirationTime / 1000,
            // `secret` is provided globally via JwtModule.registerAsync
        });
    }

    /**
     * Issues a persistent refresh token and saves it.
     */
    async issueRefresh(
        user: User | AdminUser,
        device?: DeviceInfo,
    ): Promise<string> {
        const token = uuidv4();
        const cfg = this.getJwtConfigForUser(user);

        const expiresAtMs =
            Date.now()
            + cfg.accessTokenExpirationTime
            + cfg.refreshTimeWindow;

        const entity = this.refreshRepo.create({
            token,
            user_id: user.id,
            user_type: user instanceof User ? "end_user" : "admin",
            device_info: device ?? null,
            ip_address: device?.ip ?? null,
            expires_at: new Date(expiresAtMs),
            last_used_at: new Date(),
            refresh_count: 0,
        });

        await this.refreshRepo.save(entity);
        return token;
    }

    /**
     * Exchanges a refresh token for new access + refresh token.
     * Removes/rotates the stored refresh token atomically.
     */
    async refresh(
        token: string,
        device?: DeviceInfo,
    ): Promise<RefreshTokenResponseDto> {
        return this.dataSource.transaction(async (tx) => {
            const refreshToken = await tx.findOne(RefreshToken, {
                where: { token },
            });

            if (!refreshToken) {
                throw new UnauthorizedException("Invalid refresh token");
            }

            if (refreshToken.expires_at < new Date()) {
                await tx.remove(RefreshToken, refreshToken);
                throw new UnauthorizedException("Refresh token expired");
            }

            const user =
                await this.users.getUserByType(
                    refreshToken.user_id,
                    refreshToken.user_type as "end_user" | "admin",
                );

            if (!user) {
                await tx.remove(RefreshToken, refreshToken);
                throw new UnauthorizedException("User not found");
            }

            const cfg = this.getJwtConfigForUser(user);

            if (refreshToken.refresh_count >= cfg.maxNumberOfRefreshes) {
                await tx.remove(RefreshToken, refreshToken);
                throw new UnauthorizedException(
                    "Refresh token revoked - too many refreshes"
                );
            }

            // Sign new access and rotate refresh.
            const effectiveDevice =
                device ?? this.getDeviceInfoFromRefreshToken(refreshToken);

            const accessToken = this.signAccess(user, effectiveDevice);
            const newRefresh = uuidv4();
            const newExpiresAt = new Date(
                Date.now()
                + cfg.accessTokenExpirationTime
                + cfg.refreshTimeWindow
            );

            refreshToken.token = newRefresh;
            refreshToken.expires_at = newExpiresAt;
            refreshToken.refresh_count += 1;
            refreshToken.last_used_at = new Date();
            refreshToken.device_info = effectiveDevice ?? null;
            refreshToken.ip_address = effectiveDevice?.ip ?? null;

            await tx.save(RefreshToken, refreshToken);

            return {
                access_token: accessToken,
                refresh_token: newRefresh,
            };
        });
    }

    /**
     * Creates a device fingerprint (embedded in JWT).
     */
    private fingerprint(
        device?: DeviceInfo
    ): string {
        if (!device) return "unknown";
        const base = {
            os: device.os,
            browser: device.browser,
            deviceType: device.deviceType,
            userAgent: device.userAgent,
        };
        return crypto
            .createHash("sha256")
            .update(JSON.stringify(base))
            .digest("hex");
    }

    /**
     * Returns JWT configuration for user type.
     */
    private getJwtConfigForUser(
        user: User | AdminUser
    ) {
        return user instanceof AdminUser
            ? AUTH_CONFIG.jwt.admin
            : AUTH_CONFIG.jwt.end_user;
    }

    /**
     * Normalize stored JSON device payload from refresh-token table.
     */
    private getDeviceInfoFromRefreshToken(
        refreshToken: RefreshToken,
    ): DeviceInfo | undefined {
        const info = refreshToken.device_info;
        if (!info) {
            return undefined;
        }

        return {
            ip: info.ip ?? refreshToken.ip_address ?? 'unknown',
            userAgent: info.userAgent ?? 'unknown',
            os: info.os ?? 'unknown',
            browser: info.browser ?? 'unknown',
            deviceType: info.deviceType ?? 'unknown',
            origin: info.origin ?? 'unknown',
        };
    }
}
