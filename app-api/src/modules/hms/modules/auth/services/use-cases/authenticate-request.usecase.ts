import { Injectable } from "@nestjs/common";
import { Request as InterceptedRequest } from "express";
import { AuthZService } from "../authz.service";
import { User }
    from "@hms-module/modules/users/entities/user.entity";
import { AdminUser }
    from "../../../users/entities/admin-user.entity";

/**
 * Wraps AuthZService.verifyAndGetUser for orchestration consistency.
 */
@Injectable()
export class AuthenticateRequestUseCase {
    constructor(
        private readonly authz: AuthZService,
    ) { }

    async execute(
        request: InterceptedRequest
    ): Promise<User | AdminUser> {
        return this.authz.verifyAndGetUser(request);
    }
}
