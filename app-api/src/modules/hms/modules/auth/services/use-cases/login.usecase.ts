import { Injectable } from "@nestjs/common";
import { DeviceInfo } from "../../types/device-info.type";
import {
    Requires2FAResponseDto,
    SingleStepLoginResponseDto,
} from "@hms/shared-types/hms";
import { AuthenticationMethodNotSupportedException }
    from "../../exceptions/authentication-method-not-supported.exception";
import { TokenService } from "../../services/token.service";
import { v4 as uuidv4 } from "uuid";
import { StoredTwoFactorData }
    from "../../types/two-factor-method.type";
import { AdminUser }
    from "../../../users/entities/admin-user.entity";
import { User }
    from "@hms-module/modules/users/entities/user.entity";
import { AuthenticatorRegistryService } from "../authenticator-registry.service";
import { TwoFAService } from "../twofa.service";
import { AppSetupService } from "@hms-module/modules/app-setup/app-setup.service";

@Injectable()
export class LoginUseCase {
    constructor(
        private readonly authenticators: AuthenticatorRegistryService,
        private readonly twofa: TwoFAService,
        private readonly tokens: TokenService,
        // private readonly appSetup: AppSetupService,
    ) { }

    async execute(
        payload: any,
        userType: "end_user" | "admin",
        deviceInfo: DeviceInfo,
        provider: string,
    ): Promise<SingleStepLoginResponseDto | Requires2FAResponseDto> {
        const authenticator = this.authenticators.get(provider);
        if (!authenticator) {
            throw new AuthenticationMethodNotSupportedException();
        }

        const { user } = await authenticator.authenticate(
            payload,
            userType,
        );

        if (user.two_factor_enabled) {
            return this.handle2FARequired(
                user,
                userType,
                deviceInfo,
                provider,
            );
        }

        const access = this.tokens.signAccess(user, deviceInfo);
        const refresh = await this.tokens.issueRefresh(user, deviceInfo);

        return {
            requires_2fa: false,
            access_token: access,
            refresh_token: refresh,
            user: this.buildUserDto(user),
        };
    }

    // ===== helpers =====

    private async handle2FARequired(
        user: User | AdminUser,
        userType: "end_user" | "admin",
        deviceInfo: DeviceInfo,
        provider: string,
    ): Promise<Requires2FAResponseDto> {
        const methods = await this.twofa.getActiveMethods(
            user.id,
            userType,
        );
        const primary = this.twofa.pickPrimaryOrEmail(methods);
        const available =
            this.twofa.listAvailableIncludingEmail(methods);

        const second = uuidv4();
        const dataToStore: StoredTwoFactorData = {
            user_id: user.id,
            user_type: userType,
            device_info: deviceInfo,
            provider,
            current_method: primary,
        };

        await this.twofa.storeLogin2FA(second, dataToStore);

        const prep = await this.twofa.prepareWithHandler(
            user,
            primary,
            dataToStore,
        );

        return {
            requires_2fa: true,
            twofa: {
                second_step_token: second,
                method: primary,
                message: prep.message,
                available_2fa_methods: available,
            },
        };
    }

    private buildUserDto(
        user: User | AdminUser
    ) {
        if (user instanceof User) {
            return {
                id: user.id,
                email: user.email,
                username: user.username,
                display_name: user.display_name,
                type: "end_user" as const,
            };
        }
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            type: "admin" as const,
        };
    }
}
