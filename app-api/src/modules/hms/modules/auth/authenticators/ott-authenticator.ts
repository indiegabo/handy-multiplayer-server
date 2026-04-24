import { UserNotFoundException }
    from "../exceptions/user-not-found.exception";
import {
    HMSAuthenticator,
    HMSAuthenticatorResponse,
} from "./hms-authenticator";
import { UsersService }
    from "../../users/services/users.service";
import { OttLoginPayload }
    from "../payloads/auth.payload";
import { AuthSupportPort }
    from "../services/ports/auth-support.port";
import { UserType } from "@hms/shared-types/hms";

export class OttAuthenticator extends HMSAuthenticator {
    public get provider(): string { return "ott"; }

    constructor(
        protected readonly authSupport: AuthSupportPort,
        protected readonly usersService: UsersService,
    ) {
        super(authSupport, usersService);
    }

    public async authenticate(
        payload: OttLoginPayload,
        userType: UserType,
    ): Promise<HMSAuthenticatorResponse> {
        const { user } =
            await this.authSupport.validateOneTimeTokenForLogin(
                payload.token
            );

        if (!user) {
            throw new UserNotFoundException("User not found");
        }

        return { user };
    }
}
