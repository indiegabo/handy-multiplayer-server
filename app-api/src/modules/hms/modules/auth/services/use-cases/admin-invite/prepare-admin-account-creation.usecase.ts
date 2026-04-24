import { Injectable, BadRequestException } from "@nestjs/common";
import { OneTimeTokensService } from "@hms-module/modules/one-time-tokens/one-time-tokens.service";
import { TwoFAService } from "../../twofa.service";
import { Prepare2FAAccountCreationResponseDto } from "@hms/shared-types/hms";

@Injectable()
export class PrepareAdminAccountCreationUseCase {
    constructor(
        private readonly ott: OneTimeTokensService,
        private readonly twofa: TwoFAService,
    ) { }

    async execute(invite_token: string): Promise<Prepare2FAAccountCreationResponseDto> {
        const token = await this.ott.findByToken(invite_token);
        if (!token) {
            throw new BadRequestException("Invalid or expired invitation token.");
        }

        const data = token.getDataAs<Partial<{ invitee_email: string }>>();
        if (!data?.invitee_email) {
            throw new BadRequestException("Malformed invitation token.");
        }

        const twofa = await this.twofa.generateAdminSetupData(data.invitee_email);

        return {
            email: data.invitee_email,
            qrcode_url: twofa.qrCodeUrl,
            manual_entry_code: twofa.manualEntryCode,
            setup_token: twofa.setupToken,
        };
    }
}
