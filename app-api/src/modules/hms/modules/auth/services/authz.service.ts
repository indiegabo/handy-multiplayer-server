import {
    Injectable,
    UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Request as InterceptedRequest } from "express";
import * as crypto from "crypto";
import {
    JsonWebTokenError,
    NotBeforeError,
    TokenExpiredError,
} from "jsonwebtoken";

import { UsersService }
    from "@hms-module/modules/users/services/users.service";
import { BetterLogger }
    from "@hms-module/modules/better-logger/better-logger.service";
import { User }
    from "@hms-module/modules/users/entities/user.entity";
import { DeviceInfo }
    from "../types/device-info.type";
import { AdminUser } from "../../users/entities/admin-user.entity";

/**
 * Centralizes request authN concerns:
 * - Parse & verify JWT
 * - Check device fingerprint (if present)
 * - Load user
 */
@Injectable()
export class AuthZService {
    constructor(
        private readonly jwt: JwtService,
        private readonly config: ConfigService,
        private readonly users: UsersService,
        private readonly logger: BetterLogger,
    ) {
        this.logger.setContext(AuthZService.name);
    }

    async verifyAndGetUser(
        request: InterceptedRequest
    ): Promise<User | AdminUser> {
        const token = this.extractJWTFromHeader(request);
        if (!token) {
            throw new UnauthorizedException("No token provided");
        }

        let payload: any;
        try {
            payload = this.jwt.verify(token, {
                secret: this.config.get<string>("JWT_SECRET"),
            });
        } catch (error: any) {
            throw this.mapJwtVerificationError(error);
        }

        this.validateJWTPayloadStructure(payload);

        const enforceDeviceFingerprint =
            this.config.get<string>('AUTH_ENFORCE_DEVICE_FP') !== 'false';

        const currentDeviceFp =
            this.createDeviceFingerprint(request.deviceInfo);
        if (
            enforceDeviceFingerprint
            && payload.device_fp
            && payload.device_fp !== currentDeviceFp
        ) {
            this.logger.warn("Device fingerprint mismatch");
            throw new UnauthorizedException("Device verification failed");
        }

        const user = await this.users.getUserByType(
            payload.sub,
            payload.user_type
        );
        if (!user) {
            throw new UnauthorizedException("User not found for authentication");
        }

        return user;
    }

    private mapJwtVerificationError(error: unknown): UnauthorizedException {
        if (error instanceof UnauthorizedException) {
            return error;
        }

        if (error instanceof TokenExpiredError) {
            return new UnauthorizedException({
                message: "Token expired",
                code: "token_expired",
            });
        }

        if (error instanceof NotBeforeError) {
            return new UnauthorizedException({
                message: "Token not active",
                code: "token_not_active",
            });
        }

        if (error instanceof JsonWebTokenError) {
            if (error.message === "invalid signature") {
                return new UnauthorizedException({
                    message: "Invalid token signature",
                    code: "signature_invalid",
                });
            }

            return new UnauthorizedException({
                message: "Invalid token",
                code: "token_invalid",
            });
        }

        return new UnauthorizedException({
            message: "Invalid token",
            code: "token_invalid",
        });
    }

    // ===== helpers =====

    private extractJWTFromHeader(
        request: InterceptedRequest
    ): string | undefined {
        const [type, token] = request.headers.authorization?.split(" ") ?? [];
        return type === "Bearer" ? token : undefined;
    }

    private validateJWTPayloadStructure(
        payload: any
    ): void {
        if (!payload.sub || !payload.email || !payload.user_type) {
            throw new UnauthorizedException("Invalid token payload");
        }
    }

    private createDeviceFingerprint(
        deviceInfo?: DeviceInfo
    ): string {
        if (!deviceInfo) return "unknown";
        const base = {
            os: deviceInfo.os,
            browser: deviceInfo.browser,
            deviceType: deviceInfo.deviceType,
            userAgent: deviceInfo.userAgent,
        };
        return crypto
            .createHash("sha256")
            .update(JSON.stringify(base))
            .digest("hex");
    }
}
