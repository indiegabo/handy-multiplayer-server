import { MailService } from "../../mail/mail.service";
import { OneTimeTokensService } from "../../one-time-tokens/one-time-tokens.service";
import { AdminUser } from "../../users/entities/admin-user.entity";
import { User } from "../../users/entities/user.entity";
import { UsersService } from "../../users/services/users.service";
import { StoredTwoFactorData, TwoFactorMethod } from "../types/two-factor-method.type";

export abstract class TwoFAHandler {
    abstract get method(): TwoFactorMethod;

    constructor(
        protected usersService: UsersService,
        protected oneTimeTokensService: OneTimeTokensService,
        protected mailService: MailService,
    ) { }

    abstract prepare(
        user: User | AdminUser,
        StoredTwoFactorData: StoredTwoFactorData
    ): Promise<{
        code?: string,
        message: string
    }>;

    abstract validate(
        data: StoredTwoFactorData,
        code: string
    ): Promise<boolean>;
}
