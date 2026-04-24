import { AdminUser } from "../../users/entities/admin-user.entity";


/**
 * Runtime type guard to detect if an authenticated subject looks like
 * an `AdminUser`. We rely on stable, discriminating properties that
 * exist only on admin objects in our domain (e.g. `is_owner` or
 * `admin_permissions`). This is safer than blind casting.
 */
export function isAdminUser(obj: unknown): obj is AdminUser {
    // Prefer true runtime class identity when available.
    return obj instanceof AdminUser;
}