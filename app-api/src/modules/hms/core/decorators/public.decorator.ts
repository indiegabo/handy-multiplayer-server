import { SetMetadata } from "@nestjs/common";

/**
 * Metadata key that marks a route/controller as public (no auth).
 */
export const PUBLIC_KEY = "isPublic";

/**
 * Marks route/controller as public. Global AuthGuard will skip it.
 */
export const Public = (): ReturnType<typeof SetMetadata> =>
    SetMetadata(PUBLIC_KEY, true);
