
import { AdminUser } from "@hms-module/modules/users/entities/admin-user.entity";
import { User }
    from "@hms-module/modules/users/entities/user.entity";

/**
 * Port exposing auth support capabilities that authenticators need.
 * Keeps authenticators decoupled from AuthService.
 */
export abstract class AuthSupportPort {
    abstract validateOneTimeTokenForLogin(
        token: string
    ): Promise<{
        token: string;
        user: User | AdminUser;
    }>;
}
