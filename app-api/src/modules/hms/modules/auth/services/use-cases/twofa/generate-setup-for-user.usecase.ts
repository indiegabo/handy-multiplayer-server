import { Injectable } from "@nestjs/common";
import { TwoFAService } from "../../twofa.service";
import { User } from "@hms-module/modules/users/entities/user.entity";
import { AdminUser } from "@hms-module/modules/users/entities/admin-user.entity";

/**
 * Generate 2FA setup (QR/manually) for an existing user/admin.
 */
@Injectable()
export class Generate2FASetupForUserUseCase {
    constructor(
        private readonly twofa: TwoFAService,
    ) { }

    async execute(
        user: User | AdminUser
    ): Promise<{
        qrCodeUrl: string;
        manualEntryCode: string;
        setupToken: string;
    }> {
        return this.twofa.generateSetupDataForUser(user);
    }
}
