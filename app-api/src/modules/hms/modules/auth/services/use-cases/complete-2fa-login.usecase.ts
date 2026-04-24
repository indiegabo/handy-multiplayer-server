import {
    Injectable,
    UnauthorizedException,
} from "@nestjs/common";

import { TwoFAService }
    from "../twofa.service";
import { UsersService }
    from "@hms-module/modules/users/services/users.service";
import { TokenService }
    from "../token.service";

import {
    LoginResponseDto,
} from "@hms/shared-types/hms";
import { User }
    from "@hms-module/modules/users/entities/user.entity";
import { AdminUser }
    from "../../../users/entities/admin-user.entity";
import { InvalidCredentialsException }
    from "../../exceptions/invalid-credentials.exception";

/**
 * Complete the 2FA second step for a login session.
 * - Validate stored session.
 * - Accept either a 2FA code or a backup code.
 * - Clear session, issue tokens, return auth info.
 */
@Injectable()
export class Complete2FALoginUseCase {
    constructor(
        private readonly twofa: TwoFAService,
        private readonly users: UsersService,
        private readonly tokens: TokenService,
    ) { }

    async execute(
        secondStepToken: string,
        code: string,
        backupCode?: string,
    ): Promise<LoginResponseDto> {
        const stored = await this.twofa.getLogin2FA(secondStepToken);
        if (!stored) {
            throw new UnauthorizedException(
                "Invalid second step token",
            );
        }

        const user = await this.users.getUserByType(
            stored.user_id,
            stored.user_type,
        );

        if (!backupCode) {
            const ok = await this.twofa.validateWithHandler(
                stored,
                code,
            );
            if (!ok) {
                throw new InvalidCredentialsException(
                    "Invalid 2FA code",
                );
            }
        } else {
            await this.twofa.validateAndConsumeBackupCode(
                user,
                backupCode,
                stored.current_method,
            );
        }

        await this.twofa.clearLogin2FA(secondStepToken);

        const access = this.tokens.signAccess(
            user,
            stored.device_info,
        );
        const refresh = await this.tokens.issueRefresh(
            user,
            stored.device_info,
        );

        return {
            access_token: access,
            refresh_token: refresh,
            user: this.buildUserAuthInfo(user),
        };
    }

    private buildUserAuthInfo(
        user: User | AdminUser
    ):
        | {
            id: string;
            email: string;
            username?: string;
            display_name?: string;
            type: "end_user";
        }
        | {
            id: string;
            email: string;
            name?: string;
            type: "admin";
        } {
        if (user instanceof User) {
            return {
                id: user.id,
                email: user.email,
                username: user.username,
                display_name: user.display_name,
                type: "end_user",
            };
        }
        const admin = user as AdminUser;
        return {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            type: "admin",
        };
    }
}
