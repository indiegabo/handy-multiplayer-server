import { Injectable, BadRequestException, ConflictException } from "@nestjs/common";
import { UsersService } from "@hms-module/modules/users/services/users.service";
import { OneTimeTokensService } from "@hms-module/modules/one-time-tokens/one-time-tokens.service";
import { TwoFAService } from "../../twofa.service";
import { DataSource } from "typeorm";
import { AdminUser } from "@hms-module/modules/users/entities/admin-user.entity";
import { AdminCreationPayload } from "@hms/shared-types/hms";
import { AdminCreationFromInvitePayload } from "../../../payloads/admin-auth.payload";

@Injectable()
export class CreateAdminFromInviteUseCase {
    constructor(
        private readonly users: UsersService,
        private readonly ott: OneTimeTokensService,
        private readonly twofa: TwoFAService,
        private readonly dataSource: DataSource,
    ) { }

    /**
     * Complete admin account creation from an invitation.
     * @param payload.email admin email
     * @param payload.name admin name
     * @param payload.password admin password
     * @param payload.twofa_token 2FA token
     * @param payload.twofa_code 2FA code
     * @param payload.invite_token invitation token
     * @returns {Promise<{backup_codes: string[], admin: {type: string, id: string, email: string, name: string}}>}
     * @throws BadRequestException invalid or malformed invitation token
     * @throws ConflictException an administrator with the same email already exists
     */
    async execute(payload: AdminCreationFromInvitePayload): Promise<{
        backup_codes: string[];
        admin: {
            type: "admin";
            id: string;
            email: string;
            name: string;
        };
    }> {
        const ott = await this.ott.findByToken(payload.invite_token);
        if (!ott) {
            throw new BadRequestException("Invalid or expired invitation token.");
        }

        const normalizedEmail = payload.email.trim().toLowerCase();
        const invitationData = ott.getDataAs<Partial<{ invitee_email: string }>>();
        if (!invitationData?.invitee_email || invitationData.invitee_email !== normalizedEmail) {
            throw new BadRequestException("Malformed invitation token.");
        }

        const existing = await this.users.findAdminByEmail(normalizedEmail);
        if (existing) {
            throw new ConflictException("An administrator with this email already exists.");
        }

        const admin = await this.users.createAdmin({
            email: normalizedEmail,
            name: payload.name,
            password: payload.password,
        });

        if (!(admin instanceof AdminUser)) {
            throw new BadRequestException("Failed to create administrator user.");
        }

        const backup_codes = await this.twofa.completeSetup(
            admin,
            payload.twofa_token,
            payload.twofa_code,
            this.dataSource,
        );

        await this.ott.consume(payload.invite_token);

        return {
            backup_codes,
            admin: {
                type: "admin",
                id: admin.id,
                email: admin.email,
                name: admin.name,
            },
        };
    }
}
