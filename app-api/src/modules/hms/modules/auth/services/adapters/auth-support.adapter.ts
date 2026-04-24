import { Injectable } from "@nestjs/common";
import { AuthSupportPort }
    from "../ports/auth-support.port";
import { User }
    from "@hms-module/modules/users/entities/user.entity";
import { ValidateOneTimeTokenUseCase } from "../use-cases/twofa/validate-one-time-token.usecase";
import { AdminUser } from "@hms-module/modules/users/entities/admin-user.entity";

/**
 * Adapter implementing AuthSupportPort via use-cases.
 */
@Injectable()
export class AuthSupportAdapter implements AuthSupportPort {
    constructor(
        private readonly validateOTT: ValidateOneTimeTokenUseCase,
    ) { }

    async validateOneTimeTokenForLogin(
        token: string
    ): Promise<{
        token: string;
        user: User | AdminUser;
    }> {
        return this.validateOTT.execute(token);
    }
}
