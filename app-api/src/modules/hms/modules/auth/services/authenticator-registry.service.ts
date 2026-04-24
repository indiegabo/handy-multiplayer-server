import { Injectable } from "@nestjs/common";
import { AUTH_CONFIG }
    from "@src/config/hms/auth.config";
import { HMSAuthenticator }
    from "../authenticators/hms-authenticator";
import { UsersService }
    from "@hms-module/modules/users/services/users.service";
import { AuthSupportPort }
    from "./ports/auth-support.port";

/**
 * Central registry for HMS authenticators.
 * Builds authenticators from AUTH_CONFIG once and exposes them by provider.
 */
@Injectable()
export class AuthenticatorRegistryService {
    private readonly authenticators
        = new Map<string, HMSAuthenticator>();

    constructor(
        private readonly authSupport: AuthSupportPort,
        private readonly users: UsersService,
    ) {
        for (const entry of AUTH_CONFIG.authenticators) {
            const instance = new entry.type(
                this.authSupport,
                this.users,
            );
            this.authenticators.set(instance.provider, instance);
        }
    }

    get(provider: string): HMSAuthenticator | undefined {
        return this.authenticators.get(provider);
    }

    listProviders(): string[] {
        return [...this.authenticators.keys()];
    }
}
