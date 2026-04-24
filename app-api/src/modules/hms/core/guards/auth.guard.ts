import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { AuthFacade } from "@src/modules/hms/modules/auth/auth.facade";
import { AccessPolicy, AUTH_SUBJECT_KEY } from "../decorators/auth-subject.decorator";
import { AdminUser } from "@src/modules/hms/modules/users/entities/admin-user.entity";

/**
 * Global guard that:
 * - Is public by default (no metadata -> allow).
 * - If @AuthSubject(): authenticates the request via AuthFacade.
 * - If AdminOnly: additionally enforces AdminUser.
 * - If OwnerOnly: enforces AdminUser with is_owner === true.
 */
@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly auth: AuthFacade,
    ) { }

    async canActivate(ctx: ExecutionContext): Promise<boolean> {
        const strategy = this.reflector.getAllAndOverride<AccessPolicy>(
            AUTH_SUBJECT_KEY,
            [ctx.getHandler(), ctx.getClass()],
        );

        // Public by default
        if (!strategy) return true;

        const req = ctx.switchToHttp().getRequest<Request>();

        // Authenticate (idempotent if already set)
        const user =
            req.authenticated ?? (await this.auth.authenticateRequest(req));

        // Admin-only checks
        if (
            strategy === AccessPolicy.AdminOnly ||
            strategy === AccessPolicy.OwnerOnly
        ) {
            if (!(user instanceof AdminUser)) {
                throw new UnauthorizedException();
            }

            if (strategy === AccessPolicy.OwnerOnly) {
                if (!user.is_owner) {
                    throw new UnauthorizedException();
                }
            }
        }

        // AnyUser requires no extra checks beyond authentication
        req.authenticated = user;
        return true;
    }
}
