import { TokenType } from "../../one-time-tokens/types/token-types.enum";
import { AdminUser } from "../../users/entities/admin-user.entity";
import { User } from "../../users/entities/user.entity";
import { StoredTwoFactorData, TwoFactorMethod } from "../types/two-factor-method.type";
import { TwoFAHandler } from "./twofa-handler";

export class EmailTwoFAHandler extends TwoFAHandler {
    public get method(): TwoFactorMethod {
        return TwoFactorMethod.EMAIL;
    }

    async setup(
        user: User | AdminUser,
        _payload: any
    ): Promise<void> {
        const userType = user instanceof User ? "end_user" : "admin";
        await this.usersService.createUser2FAMethod(
            user.id,
            userType,
            this.method,
        );
    }

    async prepare(
        user: User | AdminUser,
        _stored2FAData: StoredTwoFactorData,
    ): Promise<{ code?: string; message: string }> {
        const ott = this.oneTimeTokensService.generateToken({
            type: TokenType.NUMERIC,
            length: 6,
        });

        await this.mailService.sendLoginToken(user.email, ott);

        return {
            code: ott,
            message: `A login code has been sent to ${this.obfuscateEmail(user.email)}`,
        };
    }

    async validate(
        stored2FAData: StoredTwoFactorData,
        code: string
    ): Promise<boolean> {
        return stored2FAData.ott === code;
    }

    private obfuscateEmail(email: string): string {
        const [name, domain] = email.split("@");
        const visiblePart = name.slice(0, 3);
        return `${visiblePart}****@${domain}`;
    }
}
