import { Injectable } from "@nestjs/common";
import { TwoFAService } from "../../twofa.service";
import { User } from "@hms-module/modules/users/entities/user.entity";
import { EntityManager } from "typeorm";
import { AdminUser } from "@hms-module/modules/users/entities/admin-user.entity";

/**
 * Complete admin 2FA setup and return backup codes.
 * (Uses TwoFAService.completeSetup under the hood.)
 */
@Injectable()
export class CompleteAdmin2FASetupUseCase {
    constructor(
        private readonly twofa: TwoFAService,
    ) { }

    async execute(
        user: User | AdminUser,
        setupToken: string,
        verificationCode: string,
        manager?: EntityManager,
    ): Promise<string[]> {
        return this.twofa.completeSetup(
            user,
            setupToken,
            verificationCode,
            manager,
        );
    }
}
