import { Injectable, OnModuleInit } from "@nestjs/common";
import { TwoFAService } from "../twofa.service";
import { UsersService } from "@hms-module/modules/users/services/users.service";
import { OneTimeTokensService } from "@hms-module/modules/one-time-tokens/one-time-tokens.service";
import { MailService } from "@hms-module/modules/mail/mail.service";
import { AUTH_CONFIG } from "@src/config/hms/auth.config";

@Injectable()
export class TwoFAHandlersBootstrap implements OnModuleInit {
    constructor(
        private readonly twofa: TwoFAService,
        private readonly users: UsersService,
        private readonly oneTimeTokens: OneTimeTokensService,
        private readonly mail: MailService,
    ) { }

    async onModuleInit() {
        this.twofa.registerHandlers(
            AUTH_CONFIG.twoFAHandlers,
            {
                users: this.users,
                oneTimeTokens: this.oneTimeTokens,
                mailService: this.mail,
            }
        );
    }
}
