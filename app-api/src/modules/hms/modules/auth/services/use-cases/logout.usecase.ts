import { Injectable } from "@nestjs/common";
import { AdminUser }
    from "../../../users/entities/admin-user.entity";
import { User }
    from "@hms-module/modules/users/entities/user.entity";
import { RefreshToken }
    from "../../entities/refresh-token.entity";
import { DataSource } from "typeorm";

/**
 * Logout by invalidating refresh token.
 * Handles user_type "admin" and both "end_user" (current) and "user" (legacy).
 */
@Injectable()
export class LogoutUseCase {
    constructor(
        private readonly dataSource: DataSource,
    ) { }

    async execute(
        user: User | AdminUser,
        refreshToken: string
    ): Promise<void> {
        const userTypeCurrent = user instanceof AdminUser ? "admin" : "end_user";

        await this.dataSource.transaction(async manager => {
            const result = await manager.delete(RefreshToken, {
                token: refreshToken,
                user_id: user.id,
                user_type: userTypeCurrent,
            });
        });
    }
}
