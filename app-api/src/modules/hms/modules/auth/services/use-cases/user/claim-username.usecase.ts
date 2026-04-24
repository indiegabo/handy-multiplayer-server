import { Injectable } from "@nestjs/common";
import { UsersService }
    from "@hms-module/modules/users/services/users.service";
import { User }
    from "@hms-module/modules/users/entities/user.entity";

/**
 * Claim a unique username for an end user.
 */
@Injectable()
export class ClaimUsernameUseCase {
    constructor(
        private readonly users: UsersService,
    ) { }

    async execute(
        user: User,
        username: string,
    ): Promise<void> {
        await this.users.claimUsername(
            user.id,
            username,
        );
    }
}
