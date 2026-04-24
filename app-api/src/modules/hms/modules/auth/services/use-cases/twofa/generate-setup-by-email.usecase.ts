import { Injectable } from "@nestjs/common";
import { TwoFAService } from "../../twofa.service";
import { UserType } from "@hms/shared-types/hms";

/**
 * Generate 2FA setup (QR/manually) given email and userType.
 * Works for both end_user and admin.
 */
@Injectable()
export class Generate2FASetupByEmailUseCase {
    constructor(
        private readonly twofa: TwoFAService,
    ) { }

    async execute(
        email: string,
        userType: UserType
    ): Promise<{
        qrCodeUrl: string;
        manualEntryCode: string;
        setupToken: string;
    }> {
        return this.twofa.generateSetupData(email, userType);
    }
}
