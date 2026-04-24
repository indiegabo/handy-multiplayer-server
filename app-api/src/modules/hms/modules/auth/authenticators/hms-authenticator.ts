import { UserType } from "@hms/shared-types/hms";
import { AdminUser }
    from "../../users/entities/admin-user.entity";
import { User }
    from "../../users/entities/user.entity";
import { UsersService }
    from "../../users/services/users.service";
import { AuthSupportPort }
    from "../services/ports/auth-support.port";

export type HMSAuthenticatorResponse = {
    user: User | AdminUser;
};

export abstract class HMSAuthenticator {
    abstract get provider(): string;

    /**
     * Authenticate a user based on payload + userType.
     */
    abstract authenticate(
        payload: any,
        userType: UserType,
    ): Promise<HMSAuthenticatorResponse>;

    constructor(
        protected readonly authSupport: AuthSupportPort,
        protected readonly usersService: UsersService,
    ) { }
}
