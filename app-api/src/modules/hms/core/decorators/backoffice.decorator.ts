import { SetMetadata } from "@nestjs/common";

/**
 * Metadata key consumed by MaintenanceGuard.
 */
export const BACKOFFICE_KEY = "route:backoffice";

/**
 * Marks a route/controller as backoffice.
 * Decorated handlers bypass maintenance blocking.
 */
export const Backoffice = SetMetadata(BACKOFFICE_KEY, true);