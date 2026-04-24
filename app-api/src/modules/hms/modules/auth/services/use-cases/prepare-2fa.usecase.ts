import {
    Injectable,
    UnauthorizedException,
} from "@nestjs/common";

import { TwoFAService }
    from "../twofa.service";
import { UsersService }
    from "@hms-module/modules/users/services/users.service";
import { TwoFactorMethod }
    from "../../types/two-factor-method.type";
import { Prepared2FAResponseDto }
    from "@hms/shared-types/hms";

/**
 * Prepare the 2FA second-step challenge for a login session.
 * - Load stored 2FA session by secondStepToken.
 * - Load the user.
 * - Ask the proper handler to "prepare" the challenge.
 */
@Injectable()
export class Prepare2FAUseCase {
    constructor(
        private readonly twofa: TwoFAService,
        private readonly users: UsersService,
    ) { }

    async execute(
        secondStepToken: string,
        method: TwoFactorMethod,
    ): Promise<Prepared2FAResponseDto> {
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

        const res = await this.twofa.prepareWithHandler(
            user,
            method,
            stored,
        );

        return {
            twofa_method: method,
            message: res.message,
        };
    }
}
