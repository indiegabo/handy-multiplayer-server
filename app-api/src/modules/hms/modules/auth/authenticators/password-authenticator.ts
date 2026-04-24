import { InvalidCredentialsException } from "../exceptions/invalid-credentials.exception";
import { UserNotFoundException } from "../exceptions/user-not-found.exception";
import {
    HMSAuthenticator,
    HMSAuthenticatorResponse,
} from "./hms-authenticator";
import * as bcrypt from "bcrypt";
import { UsersService } from "../../users/services/users.service";
import { AdminUser } from "../../users/entities/admin-user.entity";
import { User } from "../../users/entities/user.entity";
import { EndUserPasswordLoginPayload } from "../payloads/auth.payload";
import { AdminPasswordLoginPayload } from "../payloads/admin-auth.payload";
import { AuthSupportPort } from "../services/ports/auth-support.port";
import { UserType } from "@hms/shared-types/hms";

export class PasswordAuthenticator extends HMSAuthenticator {
    public get provider(): string { return "password"; }

    constructor(
        protected readonly authSupport: AuthSupportPort,
        protected readonly usersService: UsersService,
    ) {
        super(authSupport, usersService);
    }

    public async authenticate(
        payload: EndUserPasswordLoginPayload | AdminPasswordLoginPayload,
        userType: UserType,
    ): Promise<HMSAuthenticatorResponse> {
        let user: User | AdminUser | null;

        if (!this.isAdminLogin(payload, userType)) {
            user =
                await this.authenticateEndUser(
                    payload as EndUserPasswordLoginPayload
                );
        } else {
            user =
                await this.authenticateAdmin(
                    payload as AdminPasswordLoginPayload
                );
        }

        if (!user) {
            throw new UserNotFoundException();
        }

        return { user };
    }

    private isAdminLogin(
        payload: EndUserPasswordLoginPayload | AdminPasswordLoginPayload,
        userType: UserType,
    ): boolean {
        return userType === "admin" || "email" in payload;
    }

    private async authenticateAdmin(
        payload: AdminPasswordLoginPayload
    ): Promise<AdminUser | null> {
        const email = payload.email.trim().toLowerCase();
        const admin = await this.usersService.findAdminByEmail(email);
        return this.validatePassword(
            admin,
            payload.password
        ) as Promise<AdminUser | null>;
    }

    private async authenticateEndUser(
        payload: EndUserPasswordLoginPayload
    ): Promise<User | null> {
        const user = await this.findEndUser(
            payload.emailOrUsername,
            payload.emailOnly,
        );
        return this.validatePassword(
            user,
            payload.password
        ) as Promise<User | null>;
    }

    private async findEndUser(
        identifier: string,
        emailOnly?: boolean
    ): Promise<User | null> {
        const trimmedIdentifier = identifier.trim().toLowerCase();
        if (emailOnly) {
            return this.usersService.findEndUserByEmail(trimmedIdentifier);
        }
        const byEmail =
            await this.usersService.findEndUserByEmail(trimmedIdentifier);
        return byEmail
            ?? await this.usersService.findByUsername(trimmedIdentifier);
    }

    private async validatePassword(
        user: User | AdminUser | null,
        password: string
    ): Promise<User | AdminUser | null> {
        if (!user || !user.password) {
            throw new InvalidCredentialsException(
                "Invalid credentials"
            );
        }
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) {
            throw new InvalidCredentialsException(
                "Invalid credentials"
            );
        }
        return user;
    }
}
