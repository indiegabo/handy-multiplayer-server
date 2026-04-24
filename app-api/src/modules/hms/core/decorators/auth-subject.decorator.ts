import { SetMetadata } from "@nestjs/common";

/**
 * Access policy for a protected route.
 * - AnyUser: any authenticated user (admin or end user).
 * - AdminOnly: only admin users are allowed.
 */
export enum AccessPolicy {
    AnyUser = "any_user",
    AdminOnly = "admin_only",
    OwnerOnly = "owner_only",
}

/**
 * Metadata key consumed by the global guard.
 */
export const AUTH_SUBJECT_KEY = "auth:subject";

/**
 * Marks a route/controller as requiring authentication.
 * The default strategy is AnyUser (public by default if not present).
 */
export const AuthSubject = (
    strategy: AccessPolicy = AccessPolicy.AnyUser,
): ReturnType<typeof SetMetadata> =>
    SetMetadata(AUTH_SUBJECT_KEY, strategy);
