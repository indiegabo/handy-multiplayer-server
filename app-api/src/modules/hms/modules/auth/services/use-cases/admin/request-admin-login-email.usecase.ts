import { Injectable } from "@nestjs/common";
import { UsersService }
    from "@hms-module/modules/users/services/users.service";
import { OneTimeTokensService }
    from "@hms-module/modules/one-time-tokens/one-time-tokens.service";
import { MailService }
    from "@hms-module/modules/mail/mail.service";

/**
 * Send a one-time login link/code to an admin.
 * If email not found, do nothing (parity with old behavior).
 */
@Injectable()
export class RequestAdminLoginEmailUseCase {
    constructor(
        private readonly users: UsersService,
        private readonly ott: OneTimeTokensService,
        private readonly mail: MailService,
    ) { }

    async execute(
        payload: { email: string }
    ): Promise<void> {
        const admin =
            await this.users.findAdminByEmail(payload.email);
        if (!admin) return;

        const code = await this.ott.create(
            { userId: admin.id },
            1000 * 60 * 10,
        );

        await this.mail.sendLoginToken(
            admin.email,
            code.token,
        );
    }
}
