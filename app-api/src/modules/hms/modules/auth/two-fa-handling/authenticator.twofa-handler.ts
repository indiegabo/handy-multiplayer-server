import { InternalServerErrorException } from "@nestjs/common";
import { AdminUser } from "@hms-module/modules/users/entities/admin-user.entity";
import { User } from "@hms-module/modules/users/entities/user.entity";
import { StoredTwoFactorData, TwoFactorMethod } from "../types/two-factor-method.type";
import { TwoFAHandler } from "./twofa-handler";
import { authenticator as otpAuthenticator } from "otplib";

export class AuthenticatorTwoFAHandler extends TwoFAHandler {
    public get method(): TwoFactorMethod {
        return TwoFactorMethod.AUTHENTICATOR;
    }

    // construtor herdado já serve (não precisa override)

    async prepare(
        user: User | AdminUser,
        stored2FAData: StoredTwoFactorData,
    ): Promise<{ code?: string; message: string }> {
        return {
            message: "Please use your authenticator app to complete the login process",
        };
    }

    async validate(
        stored2FAData: StoredTwoFactorData,
        code: string
    ): Promise<boolean> {
        const method = await this.usersService.getUser2FAMethod(
            stored2FAData.user_id,
            stored2FAData.user_type,
            this.method
        );

        if (!method) {
            throw new InternalServerErrorException("2FA method not found upon validation");
        }

        return otpAuthenticator.check(code, method.secret_data);
    }
}
