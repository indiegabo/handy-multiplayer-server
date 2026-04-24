import {
    CanActivate,
    ExecutionContext,
    Injectable,
    Logger,
    ServiceUnavailableException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { BACKOFFICE_KEY } from "@hms-module/core/decorators/backoffice.decorator";
import { RedisService } from "@hms-module/modules/redis/redis.service";

/**
 * Global guard that blocks non-backoffice HTTP routes while
 * maintenance mode is active.
 */
@Injectable()
export class MaintenanceGuard implements CanActivate {
    private static readonly MAINTENANCE_ACTIVE_KEY =
        "maintenance:active";

    private readonly logger = new Logger(MaintenanceGuard.name);

    constructor(
        private readonly redisService: RedisService,
        private readonly reflector: Reflector,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        if (context.getType<string>() !== "http") {
            return true;
        }

        if (this.isBackofficeController(context)) {
            return true;
        }

        const request = context
            .switchToHttp()
            .getRequest<Request>();

        const requestPath = this.resolveRequestPath(request);
        if (
            this.isBackofficePath(requestPath)
            || this.isInfrastructureProbePath(requestPath)
        ) {
            return true;
        }

        try {
            const isMaintenanceActive = await this.redisService.get(
                MaintenanceGuard.MAINTENANCE_ACTIVE_KEY,
            );

            if (isMaintenanceActive === "true") {
                throw new ServiceUnavailableException(
                    "System Under Maintenance",
                );
            }
        } catch (error) {
            if (error instanceof ServiceUnavailableException) {
                throw error;
            }

            this.logger.warn(
                "Failed to verify maintenance state in Redis; allowing request.",
            );
        }

        return true;
    }

    /**
     * Allows routes explicitly marked as backoffice.
     */
    private isBackofficeController(context: ExecutionContext): boolean {
        return this.reflector.getAllAndOverride<boolean>(
            BACKOFFICE_KEY,
            [
                context.getHandler(),
                context.getClass(),
            ],
        ) === true;
    }

    /**
     * Returns request path without query string.
     */
    private resolveRequestPath(request: Request): string {
        const rawPath = request.originalUrl || request.url || "";
        const [path] = rawPath.split("?");

        return (path || "").toLowerCase();
    }

    /**
     * Detects whether the URL belongs to a backoffice route.
     */
    private isBackofficePath(path: string): boolean {
        const segments = path
            .split("/")
            .filter(Boolean);

        return segments.includes("backoffice");
    }

    /**
     * Allows infrastructure probes to pass during maintenance.
     * - /v1/health is used by container healthcheck
     * - /v1 is used by the internal Terminus pingCheck
     */
    private isInfrastructureProbePath(path: string): boolean {
        const normalizedPath = path
            .replace(/\/+$/g, "") || "/";

        if (normalizedPath === "/health") {
            return true;
        }

        if (/^\/v\d+\/health$/i.test(normalizedPath)) {
            return true;
        }

        return /^\/v\d+$/i.test(normalizedPath);
    }
}
