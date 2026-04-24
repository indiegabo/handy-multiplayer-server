import { Injectable } from "@nestjs/common";
import { OneTimeTokensService }
    from "@hms-module/modules/one-time-tokens/one-time-tokens.service";
import { UsersService }
    from "@hms-module/modules/users/services/users.service";
import { User } from "@hms-module/modules/users/entities/user.entity";
import { AdminUser } from "@hms-module/modules/users/entities/admin-user.entity";
import { InvalidCredentialsException } from "../../../exceptions/invalid-credentials.exception";

/**
 * Validate a one-time token and return its bound user.
 */
@Injectable()
export class ValidateOneTimeTokenUseCase {
    constructor(
        private readonly ott: OneTimeTokensService,
        private readonly users: UsersService,
    ) { }

    async execute(
        token: string
    ): Promise<{
        token: string;
        user: User | AdminUser;
    }> {
        const found = await this.ott.findByToken(token);
        if (!found) {
            throw new InvalidCredentialsException(
                "Invalid one-time token"
            );
        }

        await this.ott.consume(found.token);

        if (found.expiresAt < Date.now()) {
            throw new InvalidCredentialsException(
                "Token has expired"
            );
        }

        const data = found.getDataAs<{
            userId: string;
            userType: "end_user" | "admin";
        }>();

        const user = await this.users.getUserByType(
            data.userId,
            data.userType
        );

        return {
            token: found.token,
            user,
        };
    }
}
