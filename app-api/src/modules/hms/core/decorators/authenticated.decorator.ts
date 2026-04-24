import {
    createParamDecorator,
    ExecutionContext,
    Logger,
    UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";

/**
 * Retrieves the authenticated user from the request.
 * If `required` is true (default), logs and throws if user is missing.
 */
export const Authenticated = createParamDecorator(
    (required: boolean = true, ctx: ExecutionContext) => {
        const req = ctx.switchToHttp().getRequest<Request>();
        const user = (req as any)?.authenticated;

        if (required && !user) {
            const message =
                `Missing authenticated user → ` +
                `${req.method} ${req.originalUrl} (ip=${req.ip})`;

            Logger.warn(message, 'AuthenticatedDecorator');

            throw new UnauthorizedException('Missing authenticated user');
        }

        return user;
    },
);
